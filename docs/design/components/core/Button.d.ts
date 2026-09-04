/**
 * @startingPoint section="Core" subtitle="Plum primary, outline, ghost, soft, danger" viewport="700x150"
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** One plum `primary` per view; everything else is outline / ghost / soft / link. */
  variant?: "primary" | "outline" | "ghost" | "soft" | "danger-soft" | "danger" | "link";
  /** Heights: sm 35 · default 39 · primary 41 · lg 44 (tablet) · icon 39. Defaults to 41 for primary, 39 otherwise. */
  size?: "sm" | "default" | "primary" | "lg" | "icon";
  iconStart?: React.ReactNode;
  iconEnd?: React.ReactNode;
  disabled?: boolean;
  children?: React.ReactNode;
}
export function Button(props: ButtonProps): JSX.Element;
