"use server";

import { revalidatePath } from "next/cache";

import { logActivity } from "@/lib/activity/log";
import { getCurrentUser } from "@/lib/auth/server";
import { LIVE_STATUSES } from "@/lib/board/queries";
import { computeAppendRank } from "@/lib/queue/append-rank";
import { rankBetween } from "@/lib/queue/rank";
import { can } from "@/lib/roles";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type SprintActionResult =
  | { success: true }
  | { success: false; error: string };

/** Sprint planning is a manager-level operational decision (ADR 0008). */
async function requireSprintPlanner() {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "planSprint")) return null;
  return user;
}

function revalidateSprintSurfaces() {
  revalidatePath("/sprint");
  revalidatePath("/my-work");
  revalidatePath("/board");
  revalidatePath("/approvals");
}

/** Creates a new sprint starting today, sized by the tenant's cadence setting. */
export async function createSprintAction(
  name?: string | null,
): Promise<SprintActionResult> {
  const user = await requireSprintPlanner();
  if (!user) return { success: false, error: "forbidden" };

  const supabase = await createServerSupabaseClient();
  const { data: settings } = await supabase
    .from("business_settings")
    .select("sprint_cadence_days")
    .eq("business_id", user.businessId)
    .maybeSingle();
  const cadenceDays = settings?.sprint_cadence_days ?? 7;

  const startsOn = new Date();
  const endsOn = new Date(startsOn);
  endsOn.setDate(endsOn.getDate() + cadenceDays);

  const { error } = await supabase.from("sprints").insert({
    business_id: user.businessId,
    name: name?.trim() || null,
    starts_on: startsOn.toISOString().slice(0, 10),
    ends_on: endsOn.toISOString().slice(0, 10),
    status: "active",
  });
  if (error) return { success: false, error: "generic" };

  revalidateSprintSurfaces();
  return { success: true };
}

/**
 * Closes a sprint. Unfinished tasks are left exactly as they are --
 * `sprint_id` isn't a visibility gate for the board or the personal queue
 * (docs/domains/sprint-and-task-queue.md "Sync guarantee"), so they simply
 * keep showing up in their assignee's queue after the sprint closes. This
 * is the "carryover" the plan calls for: a display/rollover, not a data
 * rewrite (ADR 0008 "Consequences").
 */
export async function closeSprintAction(
  sprintId: string,
): Promise<SprintActionResult> {
  const user = await requireSprintPlanner();
  if (!user) return { success: false, error: "forbidden" };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("sprints")
    .update({ status: "closed" })
    .eq("id", sprintId)
    .eq("business_id", user.businessId);
  if (error) return { success: false, error: "generic" };

  revalidateSprintSurfaces();
  return { success: true };
}

export async function setSprintCadenceAction(
  cadenceDays: number,
): Promise<SprintActionResult> {
  const user = await requireSprintPlanner();
  if (!user) return { success: false, error: "forbidden" };
  if (!Number.isInteger(cadenceDays) || cadenceDays < 1) {
    return { success: false, error: "invalidCadence" };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("business_settings").upsert({
    business_id: user.businessId,
    sprint_cadence_days: cadenceDays,
  });
  if (error) return { success: false, error: "generic" };

  revalidateSprintSurfaces();
  return { success: true };
}

/**
 * Pulls a backlog task into an employee's lane (or moves it between
 * employees): sets the assignee, tags it with the sprint it was planned
 * in, and appends it to the end of that employee's queue. Passing `null`
 * for `staffMemberId` sends it back to the backlog (unassigned) and clears
 * its rank.
 */
export async function assignTaskToEmployeeAction(
  taskId: string,
  staffMemberId: string | null,
  sprintId: string | null,
): Promise<SprintActionResult> {
  const user = await requireSprintPlanner();
  if (!user) return { success: false, error: "forbidden" };

  const supabase = await createServerSupabaseClient();
  const { data: existingTask, error: fetchError } = await supabase
    .from("runtime_tasks")
    .select("id, work_order_id")
    .eq("id", taskId)
    .eq("business_id", user.businessId)
    .maybeSingle();
  if (fetchError || !existingTask) return { success: false, error: "notFound" };

  const queueRank = staffMemberId
    ? await computeAppendRank(supabase, user.businessId, staffMemberId)
    : null;

  const { error } = await supabase
    .from("runtime_tasks")
    .update({
      assigned_staff_member_id: staffMemberId,
      sprint_id: staffMemberId ? sprintId : null,
      queue_rank: queueRank,
    })
    .eq("id", taskId);
  if (error) return { success: false, error: "generic" };

  await logActivity(supabase, {
    businessId: user.businessId,
    actorUserId: user.id,
    verb: "task_assigned_to_sprint",
    subjectType: "runtime_task",
    subjectId: taskId,
    workOrderId: existingTask.work_order_id,
    payload: { staffMemberId, sprintId },
  });
  revalidateSprintSurfaces();
  revalidatePath(`/orders/${existingTask.work_order_id}`);
  return { success: true };
}

/**
 * Moves a task one spot up/down within its assignee's queue (the reorder
 * interaction -- see src/lib/queue/rank.ts for why this is a plain-button
 * move rather than pointer drag-and-drop). Recomputes only the moved
 * task's rank from its new neighbors; every other row is untouched.
 */
export async function moveTaskInQueueAction(
  taskId: string,
  direction: "up" | "down",
): Promise<SprintActionResult> {
  const user = await requireSprintPlanner();
  if (!user) return { success: false, error: "forbidden" };

  const supabase = await createServerSupabaseClient();
  const { data: task, error: fetchError } = await supabase
    .from("runtime_tasks")
    .select("id, assigned_staff_member_id, queue_rank")
    .eq("id", taskId)
    .eq("business_id", user.businessId)
    .maybeSingle();
  if (fetchError || !task || !task.assigned_staff_member_id) {
    return { success: false, error: "notFound" };
  }

  const { data: laneTasks, error: laneError } = await supabase
    .from("runtime_tasks")
    .select("id, queue_rank")
    .eq("business_id", user.businessId)
    .eq("assigned_staff_member_id", task.assigned_staff_member_id)
    .in("status", LIVE_STATUSES)
    .order("queue_rank", { ascending: true, nullsFirst: false });
  if (laneError) return { success: false, error: "generic" };

  const ordered = laneTasks ?? [];
  const index = ordered.findIndex((t) => t.id === taskId);
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || targetIndex < 0 || targetIndex >= ordered.length) {
    return { success: true }; // already at the edge -- no-op
  }

  const newRank =
    direction === "up"
      ? rankBetween(
          ordered[targetIndex - 1]?.queue_rank ?? null,
          ordered[targetIndex].queue_rank,
        )
      : rankBetween(
          ordered[targetIndex].queue_rank,
          ordered[targetIndex + 1]?.queue_rank ?? null,
        );

  const { error } = await supabase
    .from("runtime_tasks")
    .update({ queue_rank: newRank })
    .eq("id", taskId);
  if (error) return { success: false, error: "generic" };

  revalidateSprintSurfaces();
  return { success: true };
}

/** Optional highlight flag (ADR 0008), independent of the order-level priority. */
export async function toggleTaskPriorityAction(
  taskId: string,
  priority: boolean,
): Promise<SprintActionResult> {
  const user = await requireSprintPlanner();
  if (!user) return { success: false, error: "forbidden" };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("runtime_tasks")
    .update({ priority })
    .eq("id", taskId)
    .eq("business_id", user.businessId);
  if (error) return { success: false, error: "generic" };

  revalidateSprintSurfaces();
  return { success: true };
}
