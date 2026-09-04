export interface PopoverProps {
  open?: boolean;
  anchorAlign?: "start" | "end";
  /** The trigger. */
  children: React.ReactNode;
  content: React.ReactNode;
  width?: number;
}
export function Popover(props: PopoverProps): JSX.Element;
