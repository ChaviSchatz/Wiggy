/**
 * @startingPoint section="Core" subtitle="Section container with the hairline tick" viewport="700x220"
 */
export interface PanelProps extends React.HTMLAttributes<HTMLElement> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  /** The 2px plum tick at the leading edge of the header. On by default. */
  tick?: boolean;
  bodyStyle?: React.CSSProperties;
  children?: React.ReactNode;
}
export function Panel(props: PanelProps): JSX.Element;
