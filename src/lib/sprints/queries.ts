import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Tables } from "@/lib/supabase/database.types";

export type Sprint = Tables<"sprints">;

const DEFAULT_CADENCE_DAYS = 7;

/** The sprint currently being planned/worked -- the newest non-closed one. */
export async function fetchActiveSprint(
  supabase: SupabaseClient<Database>,
  businessId: string,
): Promise<Sprint | null> {
  const { data, error } = await supabase
    .from("sprints")
    .select("*")
    .eq("business_id", businessId)
    .neq("status", "closed")
    .order("starts_on", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchSprintCadenceDays(
  supabase: SupabaseClient<Database>,
  businessId: string,
): Promise<number> {
  const { data, error } = await supabase
    .from("business_settings")
    .select("sprint_cadence_days")
    .eq("business_id", businessId)
    .maybeSingle();
  if (error) throw error;
  return data?.sprint_cadence_days ?? DEFAULT_CADENCE_DAYS;
}

/**
 * Resolves "who am I" for the personal queue: the `staff_members` row
 * linked to the current auth user, if any (a user without one -- e.g. an
 * office-only admin -- simply has no personal queue).
 */
export async function fetchStaffMemberIdForUser(
  supabase: SupabaseClient<Database>,
  businessId: string,
  userId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("staff_members")
    .select("id")
    .eq("business_id", businessId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

export type CompletedQueueTask = {
  id: string;
  title: string;
  orderNumber: number;
  customerName: string | null;
  completedAt: string | null;
};

/** Recently-completed tasks for the "Completed" section of My Work. */
export async function fetchRecentlyCompletedTasksForStaff(
  supabase: SupabaseClient<Database>,
  businessId: string,
  staffMemberId: string,
  limit = 10,
): Promise<CompletedQueueTask[]> {
  const { data: taskRows, error } = await supabase
    .from("runtime_tasks")
    .select("id, title, work_order_id, completed_at")
    .eq("business_id", businessId)
    .eq("assigned_staff_member_id", staffMemberId)
    .eq("status", "done")
    .order("completed_at", { ascending: false })
    .limit(limit);
  if (error) throw error;

  const tasks = taskRows ?? [];
  const workOrderIds = Array.from(new Set(tasks.map((t) => t.work_order_id)));
  const { data: orders, error: ordersError } =
    workOrderIds.length > 0
      ? await supabase
          .from("work_orders")
          .select("id, number, customer_id")
          .in("id", workOrderIds)
      : { data: [], error: null };
  if (ordersError) throw ordersError;

  const customerIds = Array.from(
    new Set(
      (orders ?? [])
        .map((o) => o.customer_id)
        .filter((id): id is string => Boolean(id)),
    ),
  );
  const { data: customers, error: customersError } =
    customerIds.length > 0
      ? await supabase
          .from("customers")
          .select("id, name")
          .in("id", customerIds)
      : { data: [], error: null };
  if (customersError) throw customersError;

  const orderById = new Map((orders ?? []).map((o) => [o.id, o]));
  const customerNameById = new Map(
    (customers ?? []).map((c) => [c.id, c.name]),
  );

  return tasks.map((task) => {
    const order = orderById.get(task.work_order_id);
    return {
      id: task.id,
      title: task.title,
      orderNumber: order?.number ?? 0,
      customerName: order?.customer_id
        ? (customerNameById.get(order.customer_id) ?? null)
        : null,
      completedAt: task.completed_at,
    };
  });
}
