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

export type BoardTask = Tables<"runtime_tasks"> & {
  orderNumber: number;
  orderKind: string;
  customerName: string | null;
  assignedStaffMemberName: string | null;
  taskTypeName: string | null;
  /** The card shows the task's own `due_at` and falls back to this (ADR 0012). */
  orderDueAt: string | null;
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
          .select("id, number, work_order_kind, customer_id, due_at")
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
      orderKind: order?.work_order_kind ?? "internal",
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
    .order("full_name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
