export interface BackLinkProps {
  label: React.ReactNode;
  onClick?: () => void;
  /** RTL (default) points the chevron inline-end. */
  rtl?: boolean;
}
export function BackLink(props: BackLinkProps): JSX.Element;
