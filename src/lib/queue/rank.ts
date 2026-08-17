/**
 * Fractional ranking for `runtime_tasks.queue_rank` (ADR 0008): gives each
 * assignee's queue an exact drag-to-reorder order without renumbering every
 * row on every move -- inserting between two ranks just averages them.
 *
 * Not rebalanced: at this app's per-employee queue volumes (tens of tasks,
 * ADR 0008's "~50-60 open tasks per period" across the whole shop) the gap
 * never gets close to float precision. A rebalance pass is a `[future]` if
 * that ever changes.
 */

const RANK_GAP = 1024;

/** The rank for the first task ever assigned to an (empty) queue. */
export function firstRank(): number {
  return RANK_GAP;
}

/** Rank for appending after the current last item (or into an empty queue). */
export function rankAfter(lastRank: number | null): number {
  return lastRank === null ? firstRank() : lastRank + RANK_GAP;
}

/**
 * Rank for dropping a task between `before` and `after` (either end may be
 * `null` for "at the very start/end of the queue").
 */
export function rankBetween(
  before: number | null,
  after: number | null,
): number {
  if (before === null && after === null) return firstRank();
  if (before === null) return after! / 2;
  if (after === null) return before + RANK_GAP;
  return (before + after) / 2;
}
