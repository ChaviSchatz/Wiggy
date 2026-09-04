export interface QueueItemProps {
  customerName: string;
  orderCode: string;
  taskName?: string;
  status?: string;
  statusLabel?: string;
  referencePhotoUrl?: string | null;
  meta?: string;
  onStart?: () => void;
  onDone?: () => void;
  onOpen?: () => void;
}
export function QueueItem(props: QueueItemProps): JSX.Element;
