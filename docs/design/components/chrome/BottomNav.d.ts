export interface BottomNavProps {
  items: { id: string; label: string; icon?: string }[];
  activeId?: string;
  onSelect?: (id: string) => void;
}
export function BottomNav(props: BottomNavProps): JSX.Element;
