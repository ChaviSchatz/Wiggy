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
  /**
   * IANA zone from `businesses.timezone`. Authoritative for anything about
   * the salon's own day -- sprint dates, "completed today" -- so those never
   * fall back to the server clock (architecture §7.5).
   */
  timezone: string;
  role: Role;
};
