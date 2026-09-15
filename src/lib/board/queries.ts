import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Tables } from "@/lib/supabase/database.types";

/** Board/queue never shows the full backlog -- only live, non-terminal work (ADR 0010). */
export const LIVE_STATUSES = [
  "pending",
  "in_progress",
  "awaiting_approval",
  "returned_for_rework",
  "deferred",
] as const;

type UpcomingAppointmentRow = {
  work_order_id: string | null;
  starts_at: string;
  appointment_type_id: string;
};

/**
 * Reduces a `starts_at`-ascending list of upcoming appointments to the
 * earliest one per work order. Pure so it's unit-testable without a DB --
 * the actual query (batched, scoped to the board's live orders) lives in
 * `fetchBoardTasks`.
 */
export function nearestAppointmentByWorkOrderId(
  rows: UpcomingAppointmentRow[],
  typeNameById: Map<string, string>,
): Map<string, { typeName: string; startsAt: string }> {
  const result = new Map<string, { typeName: string; startsAt: string }>();
  for (const appt of rows) {
    if (!appt.work_order_id || result.has(appt.work_order_id)) continue;
    result.set(appt.work_order_id, {
      typeName: typeNameById.get(appt.appointment_type_id) ?? "",
      startsAt: appt.starts_at,
    });
  }
  return result;
}

export type BoardTask = Tables<"runtime_tasks"> & {
  orderNumber: number;
  /**
   * The order's intake-template name, snapshotted at generation (§5.1). Used
   * as the card's identity when the order has no customer -- it replaced
   * `work_order_kind`, which was a fixed five-value label with no behaviour
   * attached and less to say ("תיקון" vs "תיקון פאה").
   */
  templateName: string | null;
  customerName: string | null;
  assignedStaffMemberName: string | null;
  taskTypeName: string | null;
  /** The card shows the task's own `due_at` and falls back to this (ADR 0012). */
  orderDueAt: string | null;
  /** The order's nearest upcoming appointment, if any. */
  nearestAppointment: { typeName: string; startsAt: string } | null;
};

/**
 * All live tasks for the board, enriched with the display data TaskCard
 * needs. Batched (a handful of queries regardless of task count) rather
 * than embedding relations -- same approach as work-orders/queries.ts.
 */
export async function fetchBoardTasks(
  supabase: SupabaseClient<Database>,
  businessId: string,
): Promise<BoardTask[]> {
  const { data: taskRows, error } = await supabase
    .from("runtime_tasks")
    .select("*")
    .eq("business_id", businessId)
    .in("status", LIVE_STATUSES)
    .order("sequence_order", { ascending: true });
  if (error) throw error;

  const tasks = taskRows ?? [];
  const workOrderIds = Array.from(new Set(tasks.map((t) => t.work_order_id)));
  const staffIds = Array.from(
    new Set(
      tasks
        .map((t) => t.assigned_staff_member_id)
        .filter((id): id is string => Boolean(id)),
    ),
  );
  const taskTypeIds = Array.from(
    new Set(
      tasks
        .map((t) => t.task_type_id)
        .filter((id): id is string => Boolean(id)),
    ),
  );

  const [ordersResult, staffResult, taskTypesResult] = await Promise.all([
    workOrderIds.length > 0
      ? supabase
          .from("work_orders")
          .select("id, number, template_name, customer_id, due_at")
          .in("id", workOrderIds)
      : Promise.resolve({ data: [], error: null }),
    staffIds.length > 0
      ? supabase
          .from("staff_members")
          .select("id, full_name")
          .in("id", staffIds)
      : Promise.resolve({ data: [], error: null }),
    taskTypeIds.length > 0
      ? supabase.from("task_types").select("id, name").in("id", taskTypeIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (ordersResult.error) throw ordersResult.error;
  if (staffResult.error) throw staffResult.error;
  if (taskTypesResult.error) throw taskTypesResult.error;

  const orders = ordersResult.data ?? [];
  const customerIds = Array.from(
    new Set(
      orders
        .map((o) => o.customer_id)
        .filter((id): id is string => Boolean(id)),
    ),
  );
  const customersResult =
    customerIds.length > 0
      ? await supabase
          .from("customers")
          .select("id, name")
          .in("id", customerIds)
      : { data: [], error: null };
  if (customersResult.error) throw customersResult.error;

  const { data: upcomingAppointments, error: appointmentsError } =
    workOrderIds.length > 0
      ? await supabase
          .from("appointments")
          .select("work_order_id, starts_at, appointment_type_id")
          .eq("business_id", businessId)
          .eq("status", "scheduled")
          .in("work_order_id", workOrderIds)
          .gte("starts_at", new Date().toISOString())
          .order("starts_at", { ascending: true })
      : { data: [], error: null };
  if (appointmentsError) throw appointmentsError;

  const appointmentTypeIds = Array.from(
    new Set((upcomingAppointments ?? []).map((a) => a.appointment_type_id)),
  );
  const { data: appointmentTypes, error: appointmentTypesError } =
    appointmentTypeIds.length > 0
      ? await supabase
          .from("appointment_types")
          .select("id, name")
          .in("id", appointmentTypeIds)
      : { data: [] as { id: string; name: string }[], error: null };
  if (appointmentTypesError) throw appointmentTypesError;
  const appointmentTypeNameById = new Map(
    (appointmentTypes ?? []).map((t) => [t.id, t.name]),
  );

  // The query above is already sorted ascending by starts_at, so this picks
  // the earliest (first) row per order.
  const nearestAppointmentById = nearestAppointmentByWorkOrderId(
    upcomingAppointments ?? [],
    appointmentTypeNameById,
  );

  const orderById = new Map(orders.map((o) => [o.id, o]));
  const customerNameById = new Map(
    (customersResult.data ?? []).map((c) => [c.id, c.name]),
  );
  const staffNameById = new Map(
    (staffResult.data ?? []).map((s) => [s.id, s.full_name]),
  );
  const taskTypeNameById = new Map(
    (taskTypesResult.data ?? []).map((t) => [t.id, t.name]),
  );

  return tasks.map((task): BoardTask => {
    const order = orderById.get(task.work_order_id);
    return {
      ...task,
      orderNumber: order?.number ?? 0,
      templateName: order?.template_name ?? null,
      customerName: order?.customer_id
        ? (customerNameById.get(order.customer_id) ?? null)
        : null,
      assignedStaffMemberName: task.assigned_staff_member_id
        ? (staffNameById.get(task.assigned_staff_member_id) ?? null)
        : null,
      taskTypeName: task.task_type_id
        ? (taskTypeNameById.get(task.task_type_id) ?? null)
        : null,
      orderDueAt: order?.due_at ?? null,
      nearestAppointment: nearestAppointmentById.get(task.work_order_id) ?? null,
    };
  });
}

export type AssignableStaffMember = { id: string; full_name: string };

/** Options for the AssigneePicker. */
export async function fetchAssignableStaff(
  supabase: SupabaseClient<Database>,
  businessId: string,
): Promise<AssignableStaffMember[]> {
  const { data, error } = await supabase
    .from("staff_members")
    .select("id, full_name")
    .eq("business_id", businessId)
    .eq("is_active", true)
    // Separate from `is_active`: an office-only person (the owner, a
    // secretary) is active but does no bench work, so they must never be
    // offered as an assignee. Name *resolution* elsewhere deliberately
    // ignores this flag, or historical attribution would render blank.
    .eq("is_assignable", true)
    .order("full_name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
