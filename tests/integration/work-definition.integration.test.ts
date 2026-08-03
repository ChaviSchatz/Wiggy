import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";

import { seedWorkDefinition } from "../../scripts/seed-work-definition.ts";

/**
 * Slice 2 — work-definition catalog: seeds two independent tenants (reusing
 * the same `seedWorkDefinition` helper the dev seed uses) and asserts the
 * catalog is queryable under RLS for a tenant's own member, tenant-isolated
 * (including the child tables that derive tenant from a parent join), and
 * read-only for `authenticated` (no editor exists yet — see the RLS
 * migration's comment).
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const password = "work-definition-test-password";

const admin = createAdminClient();

type Tenant = {
  businessId: string;
  client: SupabaseClient<Database>;
};

async function seedTenant(label: string): Promise<Tenant> {
  const slug = `wd-${label}-${runId}`;
  const email = `wd-${label}-${runId}@wiggy.test`;

  const business = await admin
    .from("businesses")
    .insert({ name: `Work Definition ${label} ${runId}`, slug })
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

  await seedWorkDefinition(admin, business.data.id);

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

describe("work-definition catalog under RLS", () => {
  it("lets a member read their own tenant's full catalog", async () => {
    const [a] = tenants;

    const stages = await a.client
      .from("work_stages")
      .select("id, key")
      .eq("business_id", a.businessId);
    expect(stages.error).toBeNull();
    expect(stages.data).toHaveLength(8);

    const staff = await a.client
      .from("staff_members")
      .select("id")
      .eq("business_id", a.businessId);
    expect(staff.data).toHaveLength(3);

    const taskTypes = await a.client
      .from("task_types")
      .select("id")
      .eq("business_id", a.businessId);
    expect(taskTypes.data).toHaveLength(8);

    const taskGroups = await a.client
      .from("task_groups")
      .select("id, name")
      .eq("business_id", a.businessId);
    expect(taskGroups.data).toHaveLength(2);

    const templates = await a.client
      .from("intake_templates")
      .select("id, name")
      .eq("business_id", a.businessId);
    expect(templates.data).toHaveLength(1);
    expect(templates.data?.[0].name).toBe("פאה חדשה");
  });

  it("scopes task_group_items and intake_template_items via the parent's tenant", async () => {
    const [a] = tenants;

    const group = await a.client
      .from("task_groups")
      .select("id")
      .eq("business_id", a.businessId)
      .eq("name", "צבע")
      .single();
    expect(group.error).toBeNull();

    const groupItems = await a.client
      .from("task_group_items")
      .select("id, task_type_id")
      .eq("task_group_id", group.data!.id);
    expect(groupItems.error).toBeNull();
    expect(groupItems.data).toHaveLength(3);

    const template = await a.client
      .from("intake_templates")
      .select("id")
      .eq("business_id", a.businessId)
      .single();
    expect(template.error).toBeNull();

    const templateItems = await a.client
      .from("intake_template_items")
      .select("id, item_kind")
      .eq("intake_template_id", template.data!.id)
      .order("sort_order");
    expect(templateItems.error).toBeNull();
    expect(templateItems.data).toHaveLength(7);
    expect(templateItems.data?.map((item) => item.item_kind)).toEqual([
      "section",
      "field",
      "field",
      "task_group",
      "task_type",
      "task_group",
      "section",
    ]);
  });

  it("never lets a tenant see another tenant's catalog", async () => {
    const [a, b] = tenants;

    const crossStages = await a.client
      .from("work_stages")
      .select("id")
      .eq("business_id", b.businessId);
    expect(crossStages.error).toBeNull();
    expect(crossStages.data).toEqual([]);

    const crossTemplates = await a.client
      .from("intake_templates")
      .select("id")
      .eq("business_id", b.businessId);
    expect(crossTemplates.data).toEqual([]);

    // Child tables: look up B's task_group_items/intake_template_items
    // directly by id (not by business_id, since they have none) to prove
    // the parent-join-derived policy still blocks them for A.
    const bGroup = await admin
      .from("task_groups")
      .select("id")
      .eq("business_id", b.businessId)
      .eq("name", "צבע")
      .single();
    expect(bGroup.error).toBeNull();

    const crossGroupItems = await a.client
      .from("task_group_items")
      .select("id")
      .eq("task_group_id", bGroup.data!.id);
    expect(crossGroupItems.error).toBeNull();
    expect(crossGroupItems.data).toEqual([]);

    const bTemplate = await admin
      .from("intake_templates")
      .select("id")
      .eq("business_id", b.businessId)
      .single();
    expect(bTemplate.error).toBeNull();

    const crossTemplateItems = await a.client
      .from("intake_template_items")
      .select("id")
      .eq("intake_template_id", bTemplate.data!.id);
    expect(crossTemplateItems.error).toBeNull();
    expect(crossTemplateItems.data).toEqual([]);
  });

  it("does not let an authenticated member write the catalog yet (no editor slice)", async () => {
    const [a] = tenants;

    const insert = await a.client.from("work_stages").insert({
      business_id: a.businessId,
      key: "unauthorized",
      name: "should not be allowed",
      sort_order: 99,
    });

    expect(insert.error).not.toBeNull();
  });
});
