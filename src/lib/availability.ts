/**
 * Linear per-order task availability (ADR 0008, architecture §7.3).
 *
 * A task is `available` when every earlier-`sequence_order` task in the
 * *same work order* is `done`/`skipped`/`cancelled`; otherwise `blocked`
 * (visible in the board/queue, not startable). A manager's
 * `availability_override` unconditionally makes a task available.
 *
 * This is a derived overlay, never a status: the task's own `status` is
 * untouched by this computation. Pure and framework-agnostic so it's
 * directly unit-testable and reusable wherever the board/queue need it.
 */

export type TaskStatus =
  | "pending"
  | "in_progress"
  | "awaiting_approval"
  | "returned_for_rework"
  | "done"
  | "deferred"
  | "skipped"
  | "cancelled";

export type TaskAvailabilityInput = {
  id: string;
  workOrderId: string;
  sequenceOrder: number;
  status: TaskStatus;
  availabilityOverride: boolean;
};

export type Availability = "available" | "blocked";

const TERMINAL_STATUSES = new Set<TaskStatus>(["done", "skipped", "cancelled"]);

/** Availability for every task, keyed by task id. */
export function computeAvailability(
  tasks: TaskAvailabilityInput[],
): Map<string, Availability> {
  const tasksByWorkOrder = new Map<string, TaskAvailabilityInput[]>();
  for (const task of tasks) {
    const list = tasksByWorkOrder.get(task.workOrderId) ?? [];
    list.push(task);
    tasksByWorkOrder.set(task.workOrderId, list);
  }

  const result = new Map<string, Availability>();
  for (const orderTasks of Array.from(tasksByWorkOrder.values())) {
    const sorted = [...orderTasks].sort(
      (a, b) => a.sequenceOrder - b.sequenceOrder,
    );
    for (let index = 0; index < sorted.length; index++) {
      const task = sorted[index];
      if (task.availabilityOverride) {
        result.set(task.id, "available");
        continue;
      }
      const earlierTasks = sorted.slice(0, index);
      const isBlocked = earlierTasks.some(
        (t) => !TERMINAL_STATUSES.has(t.status),
      );
      result.set(task.id, isBlocked ? "blocked" : "available");
    }
  }
  return result;
}

/** Convenience for a single task's availability (e.g. before a start action). */
export function isTaskAvailable(
  task: TaskAvailabilityInput,
  allTasksInOrder: TaskAvailabilityInput[],
): boolean {
  return computeAvailability(allTasksInOrder).get(task.id) === "available";
}

type SequencedTask = Pick<
  TaskAvailabilityInput,
  "id" | "workOrderId" | "sequenceOrder" | "status"
>;

/**
 * The specific earlier task holding up a sequence-blocked task -- not just
 * "blocked", but "blocked *by this*" (My Work surfaces who that task is
 * assigned to, so a worker knows who to ask). The earliest unresolved
 * earlier task, since that's the actual next thing that has to happen
 * before the chain can move; `null` means the task isn't sequence-blocked
 * (or every earlier task is already done). Doesn't need
 * `availabilityOverride` the way `computeAvailability` does, so callers can
 * pass a plain projection of whatever task shape they already have.
 */
export function findBlockingTask<T extends SequencedTask>(
  task: T,
  allTasksInSameBusiness: T[],
): T | null {
  const blockers = allTasksInSameBusiness
    .filter(
      (t) =>
        t.workOrderId === task.workOrderId &&
        t.sequenceOrder < task.sequenceOrder &&
        !TERMINAL_STATUSES.has(t.status),
    )
    .sort((a, b) => a.sequenceOrder - b.sequenceOrder);
  return blockers[0] ?? null;
}
