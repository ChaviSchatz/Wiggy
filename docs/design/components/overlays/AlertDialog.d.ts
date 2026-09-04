export interface AlertDialogProps {
  open?: boolean;
  onClose?: () => void;
  title: React.ReactNode;
  /** Name what will happen, in plain words. */
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
}
export function AlertDialog(props: AlertDialogProps): JSX.Element;
