export type TimedItem = { id: string; startsAt: string; endsAt: string };
export type OverlapPlacement = { column: number; columnCount: number };

/**
 * Assigns each item a column index and the total column count of its
 * overlap cluster, so a renderer can lay overlapping items out
 * side-by-side (each taking 1/columnCount of the width, offset by
 * column/columnCount) -- the same visual model calendar apps like Google
 * Calendar use for concurrent events on one day.
 *
 * Two passes:
 * 1. Partition into clusters of transitively-overlapping items (so an
 *    unrelated pair of events later in the day doesn't narrow blocks
 *    earlier in the day that never overlap with them).
 * 2. Within each cluster, greedily assign the lowest-numbered free column
 *    (a column is "free" once its last-placed item's end time is at or
 *    before the next item's start time) -- the standard interval-graph
 *    colouring greedy algorithm, which uses the minimum number of columns
 *    for that cluster.
 */
export function computeOverlapLayout(items: TimedItem[]): Map<string, OverlapPlacement> {
  const result = new Map<string, OverlapPlacement>();
  if (items.length === 0) return result;

  const sorted = [...items].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );

  // Pass 1: partition into overlap clusters.
  const clusters: TimedItem[][] = [];
  let currentCluster: TimedItem[] = [sorted[0]];
  let clusterEnd = new Date(sorted[0].endsAt).getTime();
  for (let i = 1; i < sorted.length; i++) {
    const item = sorted[i];
    const start = new Date(item.startsAt).getTime();
    if (start < clusterEnd) {
      currentCluster.push(item);
      clusterEnd = Math.max(clusterEnd, new Date(item.endsAt).getTime());
    } else {
      clusters.push(currentCluster);
      currentCluster = [item];
      clusterEnd = new Date(item.endsAt).getTime();
    }
  }
  clusters.push(currentCluster);

  // Pass 2: within each cluster, greedily assign columns.
  for (const cluster of clusters) {
    const columnEndTimes: number[] = [];
    const placements: { item: TimedItem; column: number }[] = [];
    for (const item of cluster) {
      const start = new Date(item.startsAt).getTime();
      const end = new Date(item.endsAt).getTime();
      let column = columnEndTimes.findIndex((endTime) => endTime <= start);
      if (column === -1) {
        column = columnEndTimes.length;
        columnEndTimes.push(end);
      } else {
        columnEndTimes[column] = end;
      }
      placements.push({ item, column });
    }
    const columnCount = columnEndTimes.length;
    for (const { item, column } of placements) {
      result.set(item.id, { column, columnCount });
    }
  }

  return result;
}
