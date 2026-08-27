/**
 * Undo rules for the board's start/complete actions (architecture §7.1).
 *
 * Pure and framework-agnostic, like `src/lib/availability.ts`: the Server
 * Actions in `actions.ts` are thin adapters that ask these questions before
 * touching the database, so the rules are directly unit-testable.
 *
 * The undo buttons live behind the UndoToast's short grace window, but the
 * window is a UI affordance -- it is not a permission, and it does not stop
 * a stale client from firing the action later. These predicates are the
 * actual guard.
 */

import type { TaskStatus } from "@/lib/availability";

/** Undo of `startTaskAction`: only a task still in progress can be un-started. */
export function canUndoStart(status: TaskStatus): boolean {
  return status === "in_progress";
}

/**
 * Undo of `completeTaskAction`.
 *
 * A task that needed no approval goes straight to `done`, so `done` is the
 * state its own undo has to reverse. A task that *did* need approval goes to
 * `awaiting_approval` first -- reaching `done` means an approver acted on it
 * (`approveTaskAction`), and §7.1 has no `done -> in_progress` edge for that
 * path. Reopening it would also strand the `task_approvals` row describing a
 * decision about a task that is no longer done, so the correct route back is
 * `returnTaskForReworkAction`.
 */
export function canUndoComplete(
  status: TaskStatus,
  requiresApproval: boolean,
): boolean {
  if (status === "awaiting_approval") return true;
  return status === "done" && !requiresApproval;
}
