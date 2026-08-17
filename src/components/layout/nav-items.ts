import {
  CalendarRange,
  CheckCircle2,
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

import { can, type Permission, type Role } from "@/lib/roles";

export type NavItem = {
  /** Key inside the `nav` message namespace. */
  key: string;
  href: string;
  icon: LucideIcon;
  /** Permission required to see this item; omit to show it to every role. */
  permission?: Permission;
};

export type BottomNavItem = {
  /** Key inside the `bottomNav` message namespace. */
  key: string;
  href?: string;
  icon: LucideIcon;
};

// Visibility follows docs/ui/information-architecture.md "Navigation sections
// × role visibility". Dashboard has no permission gate (visible to every
// authenticated role); the rest map to the closest permission in `roles.ts`.
export const sideNavItems: NavItem[] = [
  { key: "dashboard", href: "/", icon: LayoutDashboard },
  {
    key: "myWork",
    href: "/my-work",
    icon: ListChecks,
    permission: "workOwnTasks",
  },
  { key: "board", href: "/board", icon: KanbanSquare, permission: "viewBoard" },
  {
    key: "sprint",
    href: "/sprint",
    icon: CalendarRange,
    permission: "planSprint",
  },
  {
    key: "approvals",
    href: "/approvals",
    icon: CheckCircle2,
    permission: "approveTasks",
  },
  {
    key: "orders",
    href: "/orders",
    icon: ClipboardList,
    permission: "createOrders",
  },
  {
    key: "customers",
    href: "/customers",
    icon: Users,
    permission: "editCustomers",
  },
  {
    key: "missingItems",
    href: "/missing-items",
    icon: PackageX,
    permission: "manageMissingItems",
  },
  {
    key: "settings",
    href: "/settings",
    icon: Settings,
    permission: "manageStaff",
  },
];

/** Side-nav items visible to a given role, in display order. */
export function visibleSideNavItems(role: Role): NavItem[] {
  return sideNavItems.filter(
    (item) => !item.permission || can(role, item.permission),
  );
}

// Feedback and Profile are placeholders for a later slice, so they have no route yet.
export const bottomNavItems: BottomNavItem[] = [
  { key: "myWork", href: "/my-work", icon: ListChecks },
  { key: "board", href: "/board", icon: KanbanSquare },
  { key: "feedback", icon: MessageSquare },
  { key: "profile", icon: UserCircle },
];
