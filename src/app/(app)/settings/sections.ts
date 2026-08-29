import { Building2, Users, type LucideIcon } from "lucide-react";

import { can, type Permission, type Role } from "@/lib/roles";

export type SettingsSection = {
  key: "staff" | "business";
  href: string;
  icon: LucideIcon;
  /** Any one of these is enough to open the section. */
  permissions: Permission[];
};

/**
 * The settings hub's sections (screen inventory #44).
 *
 * Lives outside `page.tsx` because a Next App Router page may only export a
 * fixed set of names -- and separating it makes the role filtering directly
 * unit-testable.
 */
export const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    key: "staff",
    href: "/settings/staff",
    icon: Users,
    permissions: ["manageStaff"],
  },
  {
    key: "business",
    href: "/settings/business",
    icon: Building2,
    permissions: ["planSprint", "editBusinessSettings"],
  },
];

/**
 * Sections a role may open. The hub renders only these, so it is never a list
 * of dead ends: managers get operational settings, admins additionally get
 * tenant identity (docs/ui/information-architecture.md).
 */
export function visibleSettingsSections(role: Role): SettingsSection[] {
  return SETTINGS_SECTIONS.filter((section) =>
    section.permissions.some((permission) => can(role, permission)),
  );
}
