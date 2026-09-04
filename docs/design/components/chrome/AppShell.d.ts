/**
 * @startingPoint section="Chrome" subtitle="Dark side nav beside the main column" viewport="1280x820"
 */
export interface AppShellProps {
  /** <SideNav> on ≥lg. */
  sideNav?: React.ReactNode;
  topBar?: React.ReactNode;
  /** <BottomNav> below lg, instead of sideNav. */
  bottomNav?: React.ReactNode;
  children?: React.ReactNode;
}
export function AppShell(props: AppShellProps): JSX.Element;
