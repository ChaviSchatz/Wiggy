/**
 * Order-status derivation (docs/architecture.md §7.2). Pure and
 * framework-agnostic: given the statuses of an order's runtime tasks, what
 * should the *order's* status be? Only covers the three states a task
 * change can ever produce -- `confirmed`, `active`, `ready_for_handoff`.
 * `draft` precedes generation (no tasks yet); `completed`/`on_hold`/
 * `cancelled` are manual-only outcomes this function never returns, and the
 * caller (`recomputeOrderStatus`) skips recomputation entirely once the
 * order is in one of those sticky states.
 */
import type { TaskStatus } from "@/lib/availability";

export type DerivedOrderStatus = "confirmed" | "active" | "ready_for_handoff";

const NON_TERMINAL_FOR_HANDOFF = new Set<TaskStatus>(["skipped", "cancelled"]);

export function deriveOrderStatus(
  taskStatuses: TaskStatus[],
): DerivedOrderStatus {
  if (taskStatuses.length === 0) return "confirmed";

  const countingTowardHandoff = taskStatuses.filter(
    (status) => !NON_TERMINAL_FOR_HANDOFF.has(status),
  );
  if (countingTowardHandoff.every((status) => status === "done")) {
    return "ready_for_handoff";
  }

  const anyBeyondPending = taskStatuses.some((status) => status !== "pending");
  return anyBeyondPending ? "active" : "confirmed";
}

/** Order statuses recompute never touches -- manual-only per §7.2. */
export const STICKY_ORDER_STATUSES = ["completed", "on_hold", "cancelled"] as const;
