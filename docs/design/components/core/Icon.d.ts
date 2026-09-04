export interface IconProps {
  /** lucide icon name, kebab-case (e.g. "plus", "chevron-right"). */
  name: string;
  /** 20 default, 16 inside controls. */
  size?: number;
  strokeWidth?: number;
  style?: React.CSSProperties;
}
export function Icon(props: IconProps): JSX.Element;
