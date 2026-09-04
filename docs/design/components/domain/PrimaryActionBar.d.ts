export interface PrimaryActionBarProps {
  /** The single plum action for the view. */
  primary?: React.ReactNode;
  secondary?: React.ReactNode;
  /** Pushed to the inline end — danger-soft trigger, never solid. */
  destructive?: React.ReactNode;
  sticky?: boolean;
}
export function PrimaryActionBar(props: PrimaryActionBarProps): JSX.Element;
