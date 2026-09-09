import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type TenantSummary = {
  id: string;
  name: string;
  slug: string | null;
  timezone: string;
  createdAt: string;
  memberCount: number;
};

/**
 * Cross-tenant listing for the platform-admin console. `businesses` RLS
 * (`businesses_select_members`, `supabase/migrations/20260803120100_rls_policies.sql`)
 * only lets a *member* see their own business, and a platform admin is a
 * member of none — so this must go through the service-role client to see
 * anything at all. Never call this outside the allowlist-gated `/platform`
 * route group.
 */
export async function listTenants(): Promise<TenantSummary[]> {
  const admin = createAdminClient();

  const [businessesResult, membershipsResult] = await Promise.all([
    admin
      .from("businesses")
      .select("id, name, slug, timezone, created_at")
      .order("created_at", { ascending: false }),
    admin.from("memberships").select("business_id").eq("is_active", true),
  ]);
  if (businessesResult.error) throw businessesResult.error;
  if (membershipsResult.error) throw membershipsResult.error;

  const counts = new Map<string, number>();
  for (const membership of membershipsResult.data ?? []) {
    counts.set(
      membership.business_id,
      (counts.get(membership.business_id) ?? 0) + 1,
    );
  }

  return (businessesResult.data ?? []).map((business) => ({
    id: business.id,
    name: business.name,
    slug: business.slug,
    timezone: business.timezone,
    createdAt: business.created_at,
    memberCount: counts.get(business.id) ?? 0,
  }));
}
