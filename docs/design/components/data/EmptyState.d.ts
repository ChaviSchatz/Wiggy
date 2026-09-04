export interface EmptyStateProps {
  /** lucide name. */
  icon?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Required in practice: one clear next action. */
  action?: React.ReactNode;
}
export function EmptyState(props: EmptyStateProps): JSX.Element;
