import type { Role } from "@/lib/roles";

/**
 * The authenticated user's identity + resolved membership.
 *
 * v1 assumes a single active membership per user — the tenant/business
 * switcher for users in more than one salon is `[future]`
 * (docs/ui/screen-inventory.md #6). If a user ever has more than one active
 * membership, the first one found is used.
 */
export type CurrentUser = {
  id: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  businessId: string;
  businessName: string;
  role: Role;
};
