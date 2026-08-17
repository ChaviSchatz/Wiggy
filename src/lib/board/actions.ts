"use server";

import { revalidatePath } from "next/cache";

import { logActivity } from "@/lib/activity/log";
import type { ActivityVerb } from "@/lib/activity/types";
import {
  computeAvailability,
  type TaskAvailabilityInput,
  type TaskStatus,
} from "@/lib/availability";
import { getCurrentUser } from "@/lib/auth/server";
import { computeAppendRank } from "@/lib/queue/append-rank";
import { can } from "@/lib/roles";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { recomputeOrderStatus } from "@/lib/work-orders/recompute";

export type TaskActionResult =
  { success: true } | { success: false; error: string };

/**
 * `workOwnTasks` gates board task actions broadly ("can do production
 * work"), not literally restricted to the acting user's own assignment --
 * shared station tablets mean any worker present may advance an unassigned
 * or a colleague's task (docs/ui/information-architecture.md: "Production
 * workers: shared station tablets ... 'who's at this station' switching").
 * Per-worker queue scoping is Slice 7's personal queue, a UI concern, not
 * a permission.
 */
async function requireBoardWorker() {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "workOwnTasks")) return null;
  return user;
}

async function requireBoardManager() {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "manageBoard")) return null;
  return user;
}

/** approve/return is a quality-control decision -- manager/admin only (ADR 0009). */
async function requireApprover() {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "approveTasks")) return null;
  return user;
}

async function fetchSiblingTasks(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  businessId: string,
  workOrderId: string,
): Promise<TaskAvailabilityInput[]> {
  const { data, error } = await supabase
    .from("runtime_tasks")
    .select("id, work_order_id, sequence_order, status, availability_override")
    .eq("business_id", businessId)
    .eq("work_order_id", workOrderId);
  if (error) throw error;

  return (data ?? []).map((task) => ({
    id: task.id,
    workOrderId: task.work_order_id,
    sequenceOrder: task.sequence_order,
    status: task.status as TaskStatus,
    availabilityOverride: task.availability_override,
  }));
}

/** Revalidates every surface a task change can appear on + logs + recomputes order status. */
async function afterTaskChange(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  {
    businessId,
    actorUserId,
    verb,
    taskId,
    workOrderId,
    payload,
  }: {
    businessId: string;
    actorUserId: string;
    verb: ActivityVerb;
    taskId: string;
    workOrderId: string;
    payload?: Record<string, string | number | boolean | null>;
  },
) {
  await logActivity(supabase, {
    businessId,
    actorUserId,
    verb,
    subjectType: "runtime_task",
    subjectId: taskId,
    workOrderId,
    payload,
  });
  await recomputeOrderStatus(supabase, workOrderId, businessId, actorUserId);
  revalidatePath("/board");
  revalidatePath(`/orders/${workOrderId}`);
  revalidatePath("/my-work");
  revalidatePath("/sprint");
  revalidatePath("/approvals");
}

const STARTABLE_STATUSES: TaskStatus[] = ["pending", "returned_for_rework"];

/**
 * pending|returned_for_rework -> in_progress (architecture §7.1). Blocked
 * (and not overridden) tasks are rejected server-side too, not just greyed
 * out client-side.
 */
export async function startTaskAction(
  taskId: string,
): Promise<TaskActionResult> {
  const user = await requireBoardWorker();
  if (!user) return { success: false, error: "forbidden" };

  const supabase = await createServerSupabaseClient();
  const { data: existingTask, error: fetchError } = await supabase
    .from("runtime_tasks")
    .select("id, work_order_id, status")
    .eq("id", taskId)
    .maybeSingle();
  if (fetchError || !existingTask) return { success: false, error: "notFound" };
  if (!STARTABLE_STATUSES.includes(existingTask.status as TaskStatus)) {
    return { success: false, error: "invalidTransition" };
  }

  const siblings = await fetchSiblingTasks(
    supabase,
    user.businessId,
    existingTask.work_order_id,
  );
  if (computeAvailability(siblings).get(taskId) !== "available") {
    return { success: false, error: "blocked" };
  }

  const { error } = await supabase
    .from("runtime_tasks")
    .update({ status: "in_progress", started_at: new Date().toISOString() })
    .eq("id", taskId);
  if (error) return { success: false, error: "generic" };

  await afterTaskChange(supabase, {
    businessId: user.businessId,
    actorUserId: user.id,
    verb: "task_started",
    taskId,
    workOrderId: existingTask.work_order_id,
  });
  return { success: true };
}

/** Undo of startTaskAction, within the UndoToast grace window. */
export async function undoStartTaskAction(
  taskId: string,
): Promise<TaskActionResult> {
  const user = await requireBoardWorker();
  if (!user) return { success: false, error: "forbidden" };

  const supabase = await createServerSupabaseClient();
  const { data: existingTask } = await supabase
    .from("runtime_tasks")
    .select("work_order_id")
    .eq("id", taskId)
    .maybeSingle();

  const { error } = await supabase
    .from("runtime_tasks")
    .update({ status: "pending", started_at: null })
    .eq("id", taskId)
    .eq("status", "in_progress");
  if (error) return { success: false, error: "generic" };

  if (existingTask) {
    await afterTaskChange(supabase, {
      businessId: user.businessId,
      actorUserId: user.id,
      verb: "task_start_undone",
      taskId,
      workOrderId: existingTask.work_order_id,
    });
  }
  return { success: true };
}

/** in_progress -> done, or -> awaiting_approval when the task snapshot requires it. */
export async function completeTaskAction(
  taskId: string,
): Promise<TaskActionResult> {
  const user = await requireBoardWorker();
  if (!user) return { success: false, error: "forbidden" };

  const supabase = await createServerSupabaseClient();
  const { data: existingTask, error: fetchError } = await supabase
    .from("runtime_tasks")
    .select("id, work_order_id, status, requires_approval")
    .eq("id", taskId)
    .maybeSingle();
  if (fetchError || !existingTask) return { success: false, error: "notFound" };
  if (existingTask.status !== "in_progress") {
    return { success: false, error: "invalidTransition" };
  }

  const nextStatus: TaskStatus = existingTask.requires_approval
    ? "awaiting_approval"
    : "done";
  const { error } = await supabase
    .from("runtime_tasks")
    .update({
      status: nextStatus,
      completed_at: nextStatus === "done" ? new Date().toISOString() : null,
    })
    .eq("id", taskId);
  if (error) return { success: false, error: "generic" };

  await afterTaskChange(supabase, {
    businessId: user.businessId,
    actorUserId: user.id,
    verb: "task_completed",
    taskId,
    workOrderId: existingTask.work_order_id,
    payload: { nextStatus },
  });
  return { success: true };
}

/** Undo of completeTaskAction, within the UndoToast grace window. */
export async function undoCompleteTaskAction(
  taskId: string,
): Promise<TaskActionResult> {
  const user = await requireBoardWorker();
  if (!user) return { success: false, error: "forbidden" };

  const supabase = await createServerSupabaseClient();
  const { data: existingTask } = await supabase
    .from("runtime_tasks")
    .select("work_order_id")
    .eq("id", taskId)
    .maybeSingle();

  const { error } = await supabase
    .from("runtime_tasks")
    .update({ status: "in_progress", completed_at: null })
    .eq("id", taskId)
    .in("status", ["done", "awaiting_approval"]);
  if (error) return { success: false, error: "generic" };

  if (existingTask) {
    await afterTaskChange(supabase, {
      businessId: user.businessId,
      actorUserId: user.id,
      verb: "task_complete_undone",
      taskId,
      workOrderId: existingTask.work_order_id,
    });
  }
  return { success: true };
}

/** Tap-avatar reassignment (screen inventory #37) -- manager/admin only (ADR 0010). */
export async function reassignTaskAction(
  taskId: string,
  staffMemberId: string | null,
): Promise<TaskActionResult> {
  const user = await requireBoardManager();
  if (!user) return { success: false, error: "forbidden" };

  const supabase = await createServerSupabaseClient();
  const { data: existingTask } = await supabase
    .from("runtime_tasks")
    .select("work_order_id, queue_rank")
    .eq("id", taskId)
    .maybeSingle();

  // A task assigned via this tap-avatar reassign (rather than Sprint
  // Planning's assign action) must still land in the assignee's queue --
  // otherwise it keeps `queue_rank = null`, which the queue-derivation and
  // reorder logic disagree about how to sort (Bug 2: null sorted first in
  // `deriveQueueSections`/the sprint board but last in
  // `moveTaskInQueueAction`'s DB query). Only fill in a rank when the task
  // doesn't already have one -- don't disturb an existing position.
  let queueRank: number | null = existingTask?.queue_rank ?? null;
  if (staffMemberId) {
    if (queueRank === null) {
      queueRank = await computeAppendRank(supabase, user.businessId, staffMemberId);
    }
  } else {
    queueRank = null;
  }

  const { error } = await supabase
    .from("runtime_tasks")
    .update({ assigned_staff_member_id: staffMemberId, queue_rank: queueRank })
    .eq("id", taskId);
  if (error) return { success: false, error: "generic" };

  if (existingTask) {
    await afterTaskChange(supabase, {
      businessId: user.businessId,
      actorUserId: user.id,
      verb: "task_reassigned",
      taskId,
      workOrderId: existingTask.work_order_id,
      payload: { staffMemberId },
    });
  }
  return { success: true };
}

/** Manual unlock of a blocked task (ADR 0008) -- manager/admin only. */
export async function setAvailabilityOverrideAction(
  taskId: string,
  override: boolean,
): Promise<TaskActionResult> {
  const user = await requireBoardManager();
  if (!user) return { success: false, error: "forbidden" };

  const supabase = await createServerSupabaseClient();
  const { data: existingTask } = await supabase
    .from("runtime_tasks")
    .select("work_order_id")
    .eq("id", taskId)
    .maybeSingle();

  const { error } = await supabase
    .from("runtime_tasks")
    .update({ availability_override: override })
    .eq("id", taskId);
  if (error) return { success: false, error: "generic" };

  if (existingTask) {
    await afterTaskChange(supabase, {
      businessId: user.businessId,
      actorUserId: user.id,
      verb: "task_availability_overridden",
      taskId,
      workOrderId: existingTask.work_order_id,
      payload: { override },
    });
  }
  return { success: true };
}

/**
 * awaiting_approval -> done (screen inventory #36, ADR 0009). Shown on the
 * board card at the stage where the worker submitted it, and in the hub's
 * task list.
 */
export async function approveTaskAction(
  taskId: string,
): Promise<TaskActionResult> {
  const user = await requireApprover();
  if (!user) return { success: false, error: "forbidden" };

  const supabase = await createServerSupabaseClient();
  const { data: existingTask, error: fetchError } = await supabase
    .from("runtime_tasks")
    .select("id, work_order_id, status")
    .eq("id", taskId)
    .maybeSingle();
  if (fetchError || !existingTask) return { success: false, error: "notFound" };
  if (existingTask.status !== "awaiting_approval") {
    return { success: false, error: "invalidTransition" };
  }

  const { error } = await supabase
    .from("runtime_tasks")
    .update({ status: "done", completed_at: new Date().toISOString() })
    .eq("id", taskId);
  if (error) return { success: false, error: "generic" };

  await supabase.from("task_approvals").insert({
    business_id: user.businessId,
    runtime_task_id: taskId,
    actor_user_id: user.id,
    action: "approve",
  });

  await afterTaskChange(supabase, {
    businessId: user.businessId,
    actorUserId: user.id,
    verb: "task_approved",
    taskId,
    workOrderId: existingTask.work_order_id,
  });
  return { success: true };
}

/** awaiting_approval -> returned_for_rework + reason (screen inventory #36, ADR 0009). */
export async function returnTaskForReworkAction(
  taskId: string,
  reason: string,
): Promise<TaskActionResult> {
  const user = await requireApprover();
  if (!user) return { success: false, error: "forbidden" };

  const trimmedReason = reason.trim();
  if (!trimmedReason) return { success: false, error: "reasonRequired" };

  const supabase = await createServerSupabaseClient();
  const { data: existingTask, error: fetchError } = await supabase
    .from("runtime_tasks")
    .select("id, work_order_id, status")
    .eq("id", taskId)
    .maybeSingle();
  if (fetchError || !existingTask) return { success: false, error: "notFound" };
  if (existingTask.status !== "awaiting_approval") {
    return { success: false, error: "invalidTransition" };
  }

  const { error } = await supabase
    .from("runtime_tasks")
    .update({ status: "returned_for_rework", completed_at: null })
    .eq("id", taskId);
  if (error) return { success: false, error: "generic" };

  await supabase.from("task_approvals").insert({
    business_id: user.businessId,
    runtime_task_id: taskId,
    actor_user_id: user.id,
    action: "return",
    reason: trimmedReason,
  });

  await afterTaskChange(supabase, {
    businessId: user.businessId,
    actorUserId: user.id,
    verb: "task_returned_for_rework",
    taskId,
    workOrderId: existingTask.work_order_id,
    payload: { reason: trimmedReason },
  });
  return { success: true };
}

const DEFERRABLE_STATUSES: TaskStatus[] = ["pending", "in_progress"];

/** Manual pause with reason + resume date (screen inventory #38). */
export async function deferTaskAction(
  taskId: string,
  reason: string,
  resumeDate: string | null,
): Promise<TaskActionResult> {
  const user = await requireBoardWorker();
  if (!user) return { success: false, error: "forbidden" };

  const trimmedReason = reason.trim();
  if (!trimmedReason) return { success: false, error: "reasonRequired" };

  const supabase = await createServerSupabaseClient();
  const { data: existingTask, error: fetchError } = await supabase
    .from("runtime_tasks")
    .select("id, work_order_id, status")
    .eq("id", taskId)
    .maybeSingle();
  if (fetchError || !existingTask) return { success: false, error: "notFound" };
  if (!DEFERRABLE_STATUSES.includes(existingTask.status as TaskStatus)) {
    return { success: false, error: "invalidTransition" };
  }

  const { error } = await supabase
    .from("runtime_tasks")
    .update({
      status: "deferred",
      deferred_reason: trimmedReason,
      deferred_until: resumeDate,
    })
    .eq("id", taskId);
  if (error) return { success: false, error: "generic" };

  await afterTaskChange(supabase, {
    businessId: user.businessId,
    actorUserId: user.id,
    verb: "task_deferred",
    taskId,
    workOrderId: existingTask.work_order_id,
    payload: { reason: trimmedReason, resumeDate },
  });
  return { success: true };
}

/** deferred -> pending (architecture §7.1); clears the defer reason/date. */
export async function resumeTaskAction(
  taskId: string,
): Promise<TaskActionResult> {
  const user = await requireBoardWorker();
  if (!user) return { success: false, error: "forbidden" };

  const supabase = await createServerSupabaseClient();
  const { data: existingTask, error: fetchError } = await supabase
    .from("runtime_tasks")
    .select("id, work_order_id, status")
    .eq("id", taskId)
    .maybeSingle();
  if (fetchError || !existingTask) return { success: false, error: "notFound" };
  if (existingTask.status !== "deferred") {
    return { success: false, error: "invalidTransition" };
  }

  const { error } = await supabase
    .from("runtime_tasks")
    .update({ status: "pending", deferred_reason: null, deferred_until: null })
    .eq("id", taskId);
  if (error) return { success: false, error: "generic" };

  await afterTaskChange(supabase, {
    businessId: user.businessId,
    actorUserId: user.id,
    verb: "task_resumed",
    taskId,
    workOrderId: existingTask.work_order_id,
  });
  return { success: true };
}
