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
  "approveTasks",
  "planSprint",
  "viewBoard",
  "workOwnTasks",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

const ROLE_PERMISSIONS: Record<Role, ReadonlySet<Permission>> = {
  admin: new Set(PERMISSIONS),
  manager: new Set<Permission>([
    "manageStaff",
    "editWorkDefinition",
    "createOrders",
    "editCustomers",
    "approveTasks",
    "planSprint",
    "viewBoard",
    "workOwnTasks",
  ]),
  secretary: new Set<Permission>([
    "createOrders",
    "editCustomers",
    "viewBoard",
  ]),
  worker: new Set<Permission>(["viewBoard", "workOwnTasks"]),
};

/** Whether a role is granted a permission. */
export function can(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.has(permission) ?? false;
}
