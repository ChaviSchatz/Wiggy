import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Tables } from "@/lib/supabase/database.types";

export type CommentWithAuthor = Tables<"task_comments"> & {
  authorName: string | null;
  taskTitle: string;
};

/**
 * Notes section of the hub (docs/ui/work-order-hub.md): the order's task
 * comments, newest first, each tagged with which task it's on since
 * `task_comments` hangs off a single `runtime_task` (§4.4) rather than the
 * order.
 */
export async function fetchCommentsForWorkOrder(
  supabase: SupabaseClient<Database>,
  workOrderId: string,
): Promise<CommentWithAuthor[]> {
  const { data: tasks, error: tasksError } = await supabase
    .from("runtime_tasks")
    .select("id, title")
    .eq("work_order_id", workOrderId);
  if (tasksError) throw tasksError;

  const taskIds = (tasks ?? []).map((t) => t.id);
  if (taskIds.length === 0) return [];

  const { data: comments, error: commentsError } = await supabase
    .from("task_comments")
    .select("*")
    .in("runtime_task_id", taskIds)
    .order("created_at", { ascending: false });
  if (commentsError) throw commentsError;

  const rows = comments ?? [];
  const authorIds = Array.from(
    new Set(
      rows
        .map((c) => c.author_user_id)
        .filter((id): id is string => Boolean(id)),
    ),
  );

  let nameById = new Map<string, string>();
  if (authorIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", authorIds);
    if (profilesError) throw profilesError;
    nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name ?? ""]));
  }

  const titleByTaskId = new Map((tasks ?? []).map((t) => [t.id, t.title]));

  return rows.map((comment) => ({
    ...comment,
    authorName: comment.author_user_id
      ? (nameById.get(comment.author_user_id) ?? null)
      : null,
    taskTitle: titleByTaskId.get(comment.runtime_task_id) ?? "",
  }));
}
