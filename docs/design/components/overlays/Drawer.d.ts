export interface DrawerProps {
  open?: boolean;
  onClose?: () => void;
  /** Identity leads: customer name. */
  title: React.ReactNode;
  /** Order code and metadata. */
  subtitle?: React.ReactNode;
  footer?: React.ReactNode;
  children?: React.ReactNode;
}
export function Drawer(props: DrawerProps): JSX.Element | null;
