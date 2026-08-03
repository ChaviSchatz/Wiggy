import {
  CalendarRange,
  ClipboardList,
  KanbanSquare,
  LayoutDashboard,
  ListChecks,
  MessageSquare,
  PackageX,
  Settings,
  UserCircle,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  /** Key inside the `nav` message namespace. */
  key: string;
  href: string;
  icon: LucideIcon;
};

export type BottomNavItem = {
  /** Key inside the `bottomNav` message namespace. */
  key: string;
  href?: string;
  icon: LucideIcon;
};

export const sideNavItems: NavItem[] = [
  { key: "dashboard", href: "/", icon: LayoutDashboard },
  { key: "myWork", href: "/my-work", icon: ListChecks },
  { key: "board", href: "/board", icon: KanbanSquare },
  { key: "sprint", href: "/sprint", icon: CalendarRange },
  { key: "orders", href: "/orders", icon: ClipboardList },
  { key: "customers", href: "/customers", icon: Users },
  { key: "missingItems", href: "/missing-items", icon: PackageX },
  { key: "settings", href: "/settings", icon: Settings },
];

// Feedback and Profile are placeholders for a later slice, so they have no route yet.
export const bottomNavItems: BottomNavItem[] = [
  { key: "myWork", href: "/my-work", icon: ListChecks },
  { key: "board", href: "/board", icon: KanbanSquare },
  { key: "feedback", icon: MessageSquare },
  { key: "profile", icon: UserCircle },
];
