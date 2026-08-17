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
  /** Permission required to see this item; omit to show it to every role. */
  permission?: Permission;
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

// Feedback is the one entry with no route: it opens the global submit-feedback
// dialog (screen inventory #58), which `BottomNav` special-cases by key.
// Sprint and Approvals mirror their side-nav entries (same permissions) so
// managers/admins have *some* reachable path to them below the `lg`
// breakpoint too (side-nav is `lg:block`-only) -- see Bug 6.
export const bottomNavItems: BottomNavItem[] = [
  { key: "myWork", href: "/my-work", icon: ListChecks, permission: "workOwnTasks" },
  { key: "board", href: "/board", icon: KanbanSquare, permission: "viewBoard" },
  { key: "sprint", href: "/sprint", icon: CalendarRange, permission: "planSprint" },
  {
    key: "approvals",
    href: "/approvals",
    icon: CheckCircle2,
    permission: "approveTasks",
  },
  { key: "feedback", icon: MessageSquare },
  { key: "profile", href: "/profile", icon: UserCircle },
];

/**
 * Bottom-nav items visible to a given role, in display order -- gated the
 * same way `visibleSideNavItems` is. To avoid overcrowding the bar (limited
 * horizontal space for icons+labels), roles that can plan sprints/approve
 * tasks (managers/admins) drop "Feedback": Sprint and Approvals are routes
 * they need reachable below `lg`, and the feedback dialog is still one tap
 * away in the top bar at every width.
 */
export function visibleBottomNavItems(role: Role): BottomNavItem[] {
  const items = bottomNavItems.filter(
    (item) => !item.permission || can(role, item.permission),
  );
  return can(role, "planSprint")
    ? items.filter((item) => item.key !== "feedback")
    : items;
}
