import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";

/**
 * RLS isolation test against local Supabase.
 *
 * Seeds two independent tenants (business + admin user + membership) with the
 * service-role client, then signs in as each user and asserts that a member can
 * see their own tenant but never the other tenant's rows.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const password = "rls-test-password";

type Tenant = {
  email: string;
  slug: string;
  businessId: string;
  userId: string;
  client: SupabaseClient<Database>;
};

const admin = createAdminClient();
const tenants: Tenant[] = [];

async function seedTenant(label: string): Promise<Tenant> {
  const slug = `rls-${label}-${runId}`;
  const email = `rls-${label}-${runId}@wiggy.test`;

  const business = await admin
    .from("businesses")
    .insert({ name: `RLS ${label} ${runId}`, slug })
    .select("id")
    .single();
  if (business.error) throw business.error;

  const user = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (user.error) throw user.error;

  const membership = await admin.from("memberships").insert({
    user_id: user.data.user.id,
    business_id: business.data.id,
    role: "admin",
  });
  if (membership.error) throw membership.error;

  const client = createClient<Database>(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const signIn = await client.auth.signInWithPassword({ email, password });
  if (signIn.error) throw signIn.error;

  return {
    email,
    slug,
    businessId: business.data.id,
    userId: user.data.user.id,
    client,
  };
}

beforeAll(async () => {
  tenants.push(await seedTenant("a"));
  tenants.push(await seedTenant("b"));
});

afterAll(async () => {
  for (const tenant of tenants) {
    await admin.from("businesses").delete().eq("id", tenant.businessId);
    await admin.auth.admin.deleteUser(tenant.userId);
  }
});

describe("RLS tenant isolation", () => {
  it("lets each user read their own business but not the other's", async () => {
    const [a, b] = tenants;

    const aBusinesses = await a.client.from("businesses").select("id, slug");
    expect(aBusinesses.error).toBeNull();
    const aVisibleIds = (aBusinesses.data ?? []).map((row) => row.id);
    expect(aVisibleIds).toEqual([a.businessId]);
    expect(aVisibleIds).not.toContain(b.businessId);

    const aReadsB = await b.client.from("businesses").select("id");
    expect((aReadsB.data ?? []).map((row) => row.id)).toEqual([b.businessId]);

    // Direct lookup of the other tenant's row returns nothing (RLS filters it).
    const crossLookup = await a.client
      .from("businesses")
      .select("id")
      .eq("id", b.businessId)
      .maybeSingle();
    expect(crossLookup.error).toBeNull();
    expect(crossLookup.data).toBeNull();
  });

  it("lets each user read their own membership but not the other's", async () => {
    const [a, b] = tenants;

    const aMemberships = await a.client
      .from("memberships")
      .select("business_id, user_id, role");
    expect(aMemberships.error).toBeNull();
    expect(aMemberships.data).toHaveLength(1);
    expect(aMemberships.data?.[0]).toMatchObject({
      business_id: a.businessId,
      user_id: a.userId,
      role: "admin",
    });

    const crossMemberships = await a.client
      .from("memberships")
      .select("id")
      .eq("business_id", b.businessId);
    expect(crossMemberships.error).toBeNull();
    expect(crossMemberships.data).toEqual([]);
  });

  it("does not let a user see the other user's profile", async () => {
    const [a, b] = tenants;

    const ownProfile = await a.client
      .from("profiles")
      .select("id")
      .eq("id", a.userId)
      .maybeSingle();
    expect(ownProfile.data?.id).toBe(a.userId);

    const otherProfile = await a.client
      .from("profiles")
      .select("id")
      .eq("id", b.userId)
      .maybeSingle();
    expect(otherProfile.data).toBeNull();
  });
});
