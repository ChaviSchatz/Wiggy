export interface QueueSection {
  id: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  items?: unknown[];
  /** The rendered QueueItem list. */
  children?: React.ReactNode;
}
export interface QueueListProps {
  sections: QueueSection[];
}
export function QueueList(props: QueueListProps): JSX.Element;
