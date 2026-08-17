import type { SupabaseClient } from "@supabase/supabase-js";

import { logActivity } from "@/lib/activity/log";
import type { TaskStatus } from "@/lib/availability";
import type { Database } from "@/lib/supabase/database.types";
import { deriveOrderStatus, STICKY_ORDER_STATUSES } from "./status";

/**
 * The DB-touching adapter around the pure `deriveOrderStatus` (architecture
 * §7.2: "a server action recalculates the derived order status after every
 * task change"). Called from every task-transition action (board + hub).
 * A no-op once the order is in a manual/sticky status -- recompute never
 * reopens a `completed`/`on_hold`/`cancelled` order. Logs its own
 * `order_status_changed` activity entry when it actually flips the status,
 * independent of the task-level entry the caller already logged.
 */
export async function recomputeOrderStatus(
  supabase: SupabaseClient<Database>,
  workOrderId: string,
  businessId?: string,
  actorUserId?: string | null,
): Promise<void> {
  const { data: order, error: orderError } = await supabase
    .from("work_orders")
    .select("status, business_id")
    .eq("id", workOrderId)
    .maybeSingle();
  if (orderError || !order) return;
  if ((STICKY_ORDER_STATUSES as readonly string[]).includes(order.status)) {
    return;
  }

  const { data: tasks, error: tasksError } = await supabase
    .from("runtime_tasks")
    .select("status")
    .eq("work_order_id", workOrderId);
  if (tasksError) return;

  const nextStatus = deriveOrderStatus(
    (tasks ?? []).map((t) => t.status as TaskStatus),
  );
  if (nextStatus === order.status) return;

  await supabase
    .from("work_orders")
    .update({ status: nextStatus })
    .eq("id", workOrderId);

  await logActivity(supabase, {
    businessId: businessId ?? order.business_id,
    actorUserId: actorUserId ?? null,
    verb: "order_status_changed",
    subjectType: "work_order",
    subjectId: workOrderId,
    workOrderId,
    payload: { from: order.status, to: nextStatus },
  });
}
