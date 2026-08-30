/**
 * Moving an item within an intake template's ordered list (screen inventory
 * #51).
 *
 * The caller writes `sort_order = index` for the whole returned list, i.e. a
 * move renumbers everything rather than swapping two rows. That is the
 * opposite trade-off to sprint planning's fractional `queue_rank`, and
 * deliberately so: a lane there spans many rows per assignee, while a
 * template holds roughly ten items. `sort_order` also defaults to 0, so a
 * template can hold duplicates -- a swap would silently do nothing in that
 * case, whereas renumbering is idempotent and self-healing.
 *
 * Pure, so the ordering is unit-testable without a database.
 */
export function renumberItems<T>(
  items: T[],
  fromIndex: number,
  direction: "up" | "down",
): T[] {
  const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1;
  const outOfRange =
    fromIndex < 0 ||
    fromIndex >= items.length ||
    toIndex < 0 ||
    toIndex >= items.length;
  if (outOfRange) return items;

  const next = [...items];
  [next[fromIndex], next[toIndex]] = [next[toIndex]!, next[fromIndex]!];
  return next;
}
