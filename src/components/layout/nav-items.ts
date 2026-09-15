import {
  CalendarDays,
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

/** What a nav item's visibility is computed from -- currently just role + bookability, but a plain object so a future dynamic condition doesn't force every call site to add another positional argument. */
export type NavVisibilityContext = { role: Role; isBookable: boolean };

export type NavItem = {
  /** Key inside the `nav` message namespace. */
  key: string;
  href: string;
  icon: LucideIcon;
  /** Permission required to see this item; omit to show it to every role. Ignored when `isVisible` is set. */
  permission?: Permission;
  /** For items whose visibility isn't a static per-role permission (e.g. depends on per-person data like bookability). Takes precedence over `permission` when present. */
  isVisible?: (context: NavVisibilityContext) => boolean;
};

export type BottomNavItem = {
  /** Key inside the `bottomNav` message namespace. */
  key: string;
  href?: string;
  icon: LucideIcon;
  /** Permission required to see this item; omit to show it to every role. Ignored when `isVisible` is set. */
  permission?: Permission;
  /** For items whose visibility isn't a static per-role permission (e.g. depends on per-person data like bookability). Takes precedence over `permission` when present. */
  isVisible?: (context: NavVisibilityContext) => boolean;
};

/** Shared visibility rule for any item declaring `isVisible`, falling back to the plain permission check otherwise. */
function isNavItemVisible(
  item: { permission?: Permission; isVisible?: (context: NavVisibilityContext) => boolean },
  context: NavVisibilityContext,
): boolean {
  if (item.isVisible) return item.isVisible(context);
  return !item.permission || can(context.role, item.permission);
}

/** The one rule this whole feature adds: visible to anyone who can manage appointments, or who is themselves a bookable person (their own calendar). */
function canSeeCalendar({ role, isBookable }: NavVisibilityContext): boolean {
  return isBookable || can(role, "manageAppointments");
}

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
    key: "calendar",
    href: "/calendar",
    icon: CalendarDays,
    isVisible: canSeeCalendar,
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
export function visibleSideNavItems(context: NavVisibilityContext): NavItem[] {
  return sideNavItems.filter((item) => isNavItemVisible(item, context));
}

// Feedback is the one entry with no route: it opens the global submit-feedback
// dialog (screen inventory #58), which `BottomNav` special-cases by key.
// Sprint and Approvals mirror their side-nav entries (same permissions) so
// managers/admins have *some* reachable path to them below the `lg`
// breakpoint too (side-nav is `lg:block`-only) -- see Bug 6.
export const bottomNavItems: BottomNavItem[] = [
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
  { key: "calendar", href: "/calendar", icon: CalendarDays, isVisible: canSeeCalendar },
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
export function visibleBottomNavItems(
  context: NavVisibilityContext,
): BottomNavItem[] {
  const items = bottomNavItems.filter((item) => isNavItemVisible(item, context));
  return can(context.role, "planSprint")
    ? items.filter((item) => item.key !== "feedback")
    : items;
}
