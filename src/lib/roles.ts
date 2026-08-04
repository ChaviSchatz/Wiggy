/**
 * Roles & permissions for a business membership.
 *
 * Roles are stored on `memberships.role`; permissions are a static capability
 * map used by the app layer to gate actions. RLS remains the source of truth
 * for data access — this map governs UI/action affordances.
 */

export const ROLES = ["admin", "manager", "secretary", "worker"] as const;
export type Role = (typeof ROLES)[number];

export const PERMISSIONS = [
  "manageUsers",
  "editBranding",
  "manageStaff",
  "editWorkDefinition",
  "createOrders",
  "editCustomers",
  "manageMissingItems",
  "approveTasks",
  "planSprint",
  "viewBoard",
  "workOwnTasks",
  "manageBoard",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

const ROLE_PERMISSIONS: Record<Role, ReadonlySet<Permission>> = {
  admin: new Set(PERMISSIONS),
  manager: new Set<Permission>([
    "manageStaff",
    "editWorkDefinition",
    "createOrders",
    "editCustomers",
    "manageMissingItems",
    "approveTasks",
    "planSprint",
    "viewBoard",
    "workOwnTasks",
    "manageBoard",
  ]),
  secretary: new Set<Permission>([
    "createOrders",
    "editCustomers",
    "manageMissingItems",
    "viewBoard",
  ]),
  worker: new Set<Permission>(["viewBoard", "workOwnTasks"]),
};

/** Whether a role is granted a permission. */
export function can(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.has(permission) ?? false;
}

/** Type guard for values coming from `memberships.role` (stored as plain text). */
export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}
