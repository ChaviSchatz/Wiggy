import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { getCustomerById, listCustomers } from "@/lib/customers/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Slice 3 — customers: exercises listCustomers/getCustomerById (and raw
 * insert/update/delete) against local Supabase, asserting per-tenant CRUD
 * works under RLS and tenant isolation holds (unlike the read-only
 * work-definition catalog, `authenticated` has full DML here).
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const password = "customers-test-password";

const admin = createAdminClient();

type Tenant = {
  businessId: string;
  client: SupabaseClient<Database>;
};

async function seedTenant(label: string): Promise<Tenant> {
  const slug = `cust-${label}-${runId}`;
  const email = `cust-${label}-${runId}@wiggy.test`;

  const business = await admin
    .from("businesses")
    .insert({ name: `Customers ${label} ${runId}`, slug })
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

  return { businessId: business.data.id, client };
}

const tenants: Tenant[] = [];

beforeAll(async () => {
  tenants.push(await seedTenant("a"));
  tenants.push(await seedTenant("b"));
});

afterAll(async () => {
  for (const tenant of tenants) {
    await admin.from("businesses").delete().eq("id", tenant.businessId);
  }
});

describe("customers CRUD under RLS", () => {
  it("lets a member create, list, and read their own customers", async () => {
    const [a] = tenants;

    const inserted = await a.client
      .from("customers")
      .insert({
        business_id: a.businessId,
        name: "דנה לוי",
        phone: "050-1111111",
        email: "dana@example.com",
      })
      .select("*")
      .single();
    expect(inserted.error).toBeNull();

    const list = await listCustomers(a.client, { businessId: a.businessId });
    expect(list.customers.map((c) => c.name)).toContain("דנה לוי");
    expect(list.total).toBeGreaterThanOrEqual(1);

    const fetched = await getCustomerById(a.client, inserted.data!.id);
    expect(fetched?.name).toBe("דנה לוי");
  });

  it("searches by name/phone/email", async () => {
    const [a] = tenants;

    await a.client.from("customers").insert({
      business_id: a.businessId,
      name: "אורית כהן",
      phone: "052-9999999",
      email: "orit@example.com",
    });

    const byName = await listCustomers(a.client, {
      businessId: a.businessId,
      search: "אורית",
    });
    expect(byName.customers.map((c) => c.name)).toContain("אורית כהן");

    const byPhone = await listCustomers(a.client, {
      businessId: a.businessId,
      search: "9999999",
    });
    expect(byPhone.customers.map((c) => c.name)).toContain("אורית כהן");

    const noMatch = await listCustomers(a.client, {
      businessId: a.businessId,
      search: "no-such-customer-xyz",
    });
    expect(noMatch.customers).toEqual([]);
    expect(noMatch.total).toBe(0);
  });

  it("lets a member update and delete their own customer", async () => {
    const [a] = tenants;

    const inserted = await a.client
      .from("customers")
      .insert({ business_id: a.businessId, name: "לקוח למחיקה" })
      .select("id")
      .single();
    expect(inserted.error).toBeNull();
    const id = inserted.data!.id;

    const updated = await a.client
      .from("customers")
      .update({ name: "שם מעודכן" })
      .eq("id", id)
      .select("name")
      .single();
    expect(updated.error).toBeNull();
    expect(updated.data?.name).toBe("שם מעודכן");

    const deleted = await a.client.from("customers").delete().eq("id", id);
    expect(deleted.error).toBeNull();

    const afterDelete = await getCustomerById(a.client, id);
    expect(afterDelete).toBeNull();
  });

  it("never lets a tenant read, update, or delete another tenant's customer", async () => {
    const [a, b] = tenants;

    const bCustomer = await admin
      .from("customers")
      .insert({ business_id: b.businessId, name: "לקוח של עסק ב" })
      .select("id")
      .single();
    expect(bCustomer.error).toBeNull();
    const bId = bCustomer.data!.id;

    const aReadsB = await getCustomerById(a.client, bId);
    expect(aReadsB).toBeNull();

    const aListsB = await a.client
      .from("customers")
      .select("id")
      .eq("business_id", b.businessId);
    expect(aListsB.data).toEqual([]);

    const aUpdatesB = await a.client
      .from("customers")
      .update({ name: "hacked" })
      .eq("id", bId)
      .select("id");
    expect(aUpdatesB.error).toBeNull();
    expect(aUpdatesB.data ?? []).toEqual([]);

    const bAfter = await admin
      .from("customers")
      .select("name")
      .eq("id", bId)
      .single();
    expect(bAfter.data?.name).not.toBe("hacked");

    const aDeletesB = await a.client
      .from("customers")
      .delete()
      .eq("id", bId)
      .select("id");
    expect(aDeletesB.error).toBeNull();
    expect(aDeletesB.data ?? []).toEqual([]);

    const stillThere = await admin
      .from("customers")
      .select("id")
      .eq("id", bId)
      .maybeSingle();
    expect(stillThere.data?.id).toBe(bId);
  });

  it("blocks inserting a customer into another tenant's business", async () => {
    const [a, b] = tenants;

    const crossInsert = await a.client.from("customers").insert({
      business_id: b.businessId,
      name: "should not be allowed",
    });
    expect(crossInsert.error).not.toBeNull();
  });
});
