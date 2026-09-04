export interface KanbanColumnProps {
  /** Stage name — stage identity comes from this text and the tick, not from colour. */
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  count?: number;
  /** Shown instead of a bare frame when the column holds no cards. */
  emptyLabel?: React.ReactNode;
  children?: React.ReactNode;
}
export function KanbanColumn(props: KanbanColumnProps): JSX.Element;
