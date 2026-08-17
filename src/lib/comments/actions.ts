"use server";

import { revalidatePath } from "next/cache";

import { logActivity } from "@/lib/activity/log";
import { getCurrentUser } from "@/lib/auth/server";
import { can } from "@/lib/roles";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type CommentActionResult =
  { success: true } | { success: false; error: string };

/** Task comments thread within the hub (screen inventory #34). */
export async function addCommentAction(
  taskId: string,
  workOrderId: string,
  body: string,
): Promise<CommentActionResult> {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "viewBoard")) {
    return { success: false, error: "forbidden" };
  }

  const trimmed = body.trim();
  if (!trimmed) return { success: false, error: "empty" };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("task_comments").insert({
    business_id: user.businessId,
    runtime_task_id: taskId,
    author_user_id: user.id,
    body: trimmed,
  });
  if (error) return { success: false, error: "generic" };

  await logActivity(supabase, {
    businessId: user.businessId,
    actorUserId: user.id,
    verb: "task_comment_added",
    subjectType: "runtime_task",
    subjectId: taskId,
    workOrderId,
  });

  revalidatePath(`/orders/${workOrderId}`);
  return { success: true };
}
