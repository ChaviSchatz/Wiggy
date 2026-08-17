/**
 * Employee personal-queue section derivation (ADR 0008, domain:
 * sprint-and-task-queue.md "Employee personal view"): current -> next ->
 * rest of queue by rank -> future/blocked -> completed.
 *
 * Pure and framework-agnostic (same spirit as `src/lib/availability.ts`):
 * takes an assignee's tasks + the availability already computed for them
 * (availability is per-work-order, so it must be computed across *all*
 * tasks in those orders, not just this assignee's slice -- callers do that
 * with `computeAvailability` before calling this).
 *
 * `awaiting_approval` tasks are deliberately excluded: ADR 0009 keeps
 * approvals out of the personal queue entirely, in a separate approver
 * view.
 */

import type { Availability, TaskStatus } from "@/lib/availability";

export type QueueTaskInput = {
  id: string;
  status: TaskStatus;
  queueRank: number | null;
};

export type BlockedReason = "sequence" | "deferred";

export type BlockedEntry<T> = { task: T; reason: BlockedReason };

export type QueueSections<T> = {
  current: T[];
  next: T | null;
  queue: T[];
  blocked: BlockedEntry<T>[];
  completed: T[];
};

const TERMINAL_STATUSES = new Set<TaskStatus>(["done", "skipped", "cancelled"]);
const STARTABLE_STATUSES = new Set<TaskStatus>([
  "pending",
  "returned_for_rework",
]);

// A null rank sorts to the END, not the start -- matching
// `moveTaskInQueueAction`'s `nullsFirst: false` DB ordering (Bug 2). Real
// ranks always start at `RANK_GAP` (src/lib/queue/rank.ts), so treating
// null as 0 would wrongly put an unranked task first.
function byRank<T extends QueueTaskInput>(a: T, b: T): number {
  return (
    (a.queueRank ?? Number.POSITIVE_INFINITY) -
    (b.queueRank ?? Number.POSITIVE_INFINITY)
  );
}

export function deriveQueueSections<T extends QueueTaskInput>(
  tasks: T[],
  availabilityById: Map<string, Availability>,
): QueueSections<T> {
  const current: T[] = [];
  const completed: T[] = [];
  const startable: T[] = [];
  const blocked: BlockedEntry<T>[] = [];

  for (const task of tasks) {
    if (task.status === "awaiting_approval") continue;
    if (task.status === "in_progress") {
      current.push(task);
      continue;
    }
    if (TERMINAL_STATUSES.has(task.status)) {
      completed.push(task);
      continue;
    }
    if (task.status === "deferred") {
      blocked.push({ task, reason: "deferred" });
      continue;
    }
    if (STARTABLE_STATUSES.has(task.status)) {
      if (availabilityById.get(task.id) === "available") {
        startable.push(task);
      } else {
        blocked.push({ task, reason: "sequence" });
      }
    }
  }

  startable.sort(byRank);
  blocked.sort((a, b) => byRank(a.task, b.task));

  const [next = null, ...queue] = startable;
  return { current, next, queue, blocked, completed };
}
