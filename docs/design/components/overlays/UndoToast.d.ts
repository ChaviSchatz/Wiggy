export interface UndoToastProps {
  open?: boolean;
  message: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}
export function UndoToast(props: UndoToastProps): JSX.Element | null;
