import type { SupabaseClient } from "@supabase/supabase-js";

import { isRole } from "@/lib/roles";
import type { Database } from "@/lib/supabase/database.types";
import type { CurrentUser } from "./types";

/**
 * Resolves the currently authenticated user's profile + active membership
 * into a single `CurrentUser`. Framework-agnostic: takes any
 * `SupabaseClient`, so it works the same from a server component, a server
 * action, or an integration test.
 *
 * Returns `null` when there is no authenticated session, no profile row, or
 * no active membership (e.g. a deactivated account) — callers redirect to
 * `/login` in that case.
 */
export async function getCurrentUserFromClient(
  supabase: SupabaseClient<Database>,
): Promise<CurrentUser | null> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) return null;

  const userId = authData.user.id;

  const [{ data: profile }, { data: membership }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("memberships")
      .select("role, business_id")
      .eq("user_id", userId)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle(),
  ]);

  if (!profile || !membership || !isRole(membership.role)) return null;

  const [{ data: business }, { data: staffMember, error: staffMemberError }] =
    await Promise.all([
      supabase
        .from("businesses")
        .select("id, name, timezone")
        .eq("id", membership.business_id)
        .maybeSingle(),
      supabase
        .from("staff_members")
        .select("id, is_bookable")
        .eq("business_id", membership.business_id)
        .eq("user_id", userId)
        .eq("is_active", true)
        .maybeSingle(),
    ]);

  if (!business) return null;
  // `.maybeSingle()` errors when more than one row matches. `staff_members`
  // has no DB-level uniqueness on (business_id, user_id) today, so a data
  // bug elsewhere (e.g. two roster rows linked to the same login) could in
  // principle produce that -- degrade to "not bookable" rather than take the
  // whole page down, but never swallow it silently: someone needs to notice
  // and fix the underlying duplicate.
  if (staffMemberError) {
    console.error(
      "[getCurrentUserFromClient] ambiguous staff_members lookup",
      { businessId: membership.business_id, userId, error: staffMemberError },
    );
  }

  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    avatarUrl: profile.avatar_url,
    businessId: business.id,
    businessName: business.name,
    timezone: business.timezone,
    role: membership.role,
    staffMemberId: staffMember?.id ?? null,
    isBookable: staffMember?.is_bookable ?? false,
  };
}

/** Whether a resolved user still needs to complete first-login bootstrap. */
export function needsBootstrap(user: Pick<CurrentUser, "fullName">): boolean {
  return !user.fullName || user.fullName.trim().length === 0;
}

/** Per-role landing page on login (docs/ui/information-architecture.md). */
export function landingPathForRole(role: CurrentUser["role"]): string {
  switch (role) {
    case "worker":
      return "/my-work";
    case "secretary":
      return "/orders";
    case "manager":
    case "admin":
    default:
      return "/";
  }
}
