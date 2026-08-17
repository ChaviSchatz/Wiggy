/**
 * Shared types for the unified activity stream (docs/architecture.md §4.5,
 * ADR 0004). One append-only table powers the work-order history section of
 * the hub, the audit log, and (future) the customer timeline.
 */
import type { Tables } from "@/lib/supabase/database.types";

export type ActivityRow = Tables<"activity">;

export type ActivitySubjectType = "work_order" | "runtime_task";

/**
 * Every verb a Slice 6 transition can write. Kept as a closed union (rather
 * than a free string) so `payload` shapes stay predictable for the history
 * renderer -- add a case here + in the renderer together.
 */
export type ActivityVerb =
  | "order_created"
  | "order_cancelled"
  | "order_delivered"
  | "order_reopened"
  | "order_status_changed"
  | "order_intake_edited"
  | "task_created"
  | "task_started"
  | "task_start_undone"
  | "task_completed"
  | "task_complete_undone"
  | "task_reassigned"
  | "task_availability_overridden"
  | "task_approved"
  | "task_returned_for_rework"
  | "task_deferred"
  | "task_resumed"
  | "task_comment_added"
  | "attachment_added"
  | "task_assigned_to_sprint";

/** Loose on purpose -- `activity.payload` is a jsonb column with no fixed
 * shape across verbs; the history renderer reads specific keys per verb. */
export type ActivityPayload = Record<string, unknown>;
