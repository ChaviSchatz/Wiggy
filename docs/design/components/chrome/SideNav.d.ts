export interface SideNavItem {
  id: string;
  label: string;
  /** lucide icon name. */
  icon?: string;
  count?: number;
}
export interface SideNavProps {
  /** Already role-filtered by the caller — the nav does not know about permissions. */
  items: SideNavItem[];
  activeId?: string;
  onSelect?: (id: string) => void;
  user?: { name: string; role: string };
  brandSubtitle?: string;
}
export function SideNav(props: SideNavProps): JSX.Element;
