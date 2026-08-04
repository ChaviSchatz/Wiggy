"use server";

import { revalidatePath } from "next/cache";

import {
  computeAvailability,
  type TaskAvailabilityInput,
  type TaskStatus,
} from "@/lib/availability";
import { getCurrentUser } from "@/lib/auth/server";
import { can } from "@/lib/roles";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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

  revalidatePath("/board");
  return { success: true };
}

/** Undo of startTaskAction, within the UndoToast grace window. */
export async function undoStartTaskAction(
  taskId: string,
): Promise<TaskActionResult> {
  const user = await requireBoardWorker();
  if (!user) return { success: false, error: "forbidden" };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("runtime_tasks")
    .update({ status: "pending", started_at: null })
    .eq("id", taskId)
    .eq("status", "in_progress");
  if (error) return { success: false, error: "generic" };

  revalidatePath("/board");
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
    .select("id, status, requires_approval")
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

  revalidatePath("/board");
  return { success: true };
}

/** Undo of completeTaskAction, within the UndoToast grace window. */
export async function undoCompleteTaskAction(
  taskId: string,
): Promise<TaskActionResult> {
  const user = await requireBoardWorker();
  if (!user) return { success: false, error: "forbidden" };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("runtime_tasks")
    .update({ status: "in_progress", completed_at: null })
    .eq("id", taskId)
    .in("status", ["done", "awaiting_approval"]);
  if (error) return { success: false, error: "generic" };

  revalidatePath("/board");
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
  const { error } = await supabase
    .from("runtime_tasks")
    .update({ assigned_staff_member_id: staffMemberId })
    .eq("id", taskId);
  if (error) return { success: false, error: "generic" };

  revalidatePath("/board");
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
  const { error } = await supabase
    .from("runtime_tasks")
    .update({ availability_override: override })
    .eq("id", taskId);
  if (error) return { success: false, error: "generic" };

  revalidatePath("/board");
  return { success: true };
}
