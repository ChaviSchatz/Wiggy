export interface DialogProps {
  open?: boolean;
  onClose?: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  width?: number;
}
export function Dialog(props: DialogProps): JSX.Element | null;
