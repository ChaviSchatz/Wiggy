export interface TopBarProps {
  /** Primary "+ New Order" for permitted roles, feedback, profile, sign out. */
  actions?: React.ReactNode;
  /** Below lg the side nav is hidden, so the wordmark reappears here. */
  showWordmark?: boolean;
}
export function TopBar(props: TopBarProps): JSX.Element;
