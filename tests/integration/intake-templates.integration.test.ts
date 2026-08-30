import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";
import { listTemplateItems } from "@/lib/work-definition/template-items";
import { listIntakeTemplates } from "@/lib/work-definition/templates";

/**
 * Settings slice 2 (screen inventory #50-52) — the intake-template editor's
 * RLS boundary and the delete rules.
 *
 * 20260830140000_intake_template_editor_rls.sql is deliberately asymmetric:
 * templates get INSERT/UPDATE but no DELETE (work_orders.intake_template_id
 * is `on delete restrict`), while items get all three. Both halves are
 * asserted here, along with the parent-join policy `intake_template_items`
 * needs because it has no `business_id` of its own.
 *
 * Server Actions themselves need a Next.js request context and aren't
 * exercised — the same boundary every other integration test here draws.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const password = "templates-test-password";

const admin = createAdminClient();

type Tenant = {
  businessId: string;
  userId: string;
  client: SupabaseClient<Database>;
};

async function seedTenant(label: string): Promise<Tenant> {
  const slug = `tpl-${label}-${runId}`;
  const email = `tpl-${label}-${runId}@wiggy.test`;

  const business = await admin
    .from("businesses")
    .insert({ name: `Templates ${label} ${runId}`, slug })
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

  return { businessId: business.data.id, userId: user.data.user.id, client };
}

async function seedTemplate(tenant: Tenant, name: string): Promise<string> {
  const inserted = await admin
    .from("intake_templates")
    .insert({
      business_id: tenant.businessId,
      name,
      work_order_kind: "repair",
    })
    .select("id")
    .single();
  if (inserted.error) throw inserted.error;
  return inserted.data.id;
}

const tenants: Tenant[] = [];
let aTemplateId = "";
let bTemplateId = "";
let bItemId = "";

beforeAll(async () => {
  tenants.push(await seedTenant("a"));
  tenants.push(await seedTenant("b"));

  aTemplateId = await seedTemplate(tenants[0]!, `A tpl ${runId}`);
  bTemplateId = await seedTemplate(tenants[1]!, `B tpl ${runId}`);

  const bItem = await admin
    .from("intake_template_items")
    .insert({
      intake_template_id: bTemplateId,
      item_kind: "field",
      field_label: `B field ${runId}`,
      sort_order: 0,
    })
    .select("id")
    .single();
  if (bItem.error) throw bItem.error;
  bItemId = bItem.data.id;
});

afterAll(async () => {
  for (const tenant of tenants) {
    await admin.from("businesses").delete().eq("id", tenant.businessId);
    await admin.auth.admin.deleteUser(tenant.userId).catch(() => {
      // Best effort: a missing user must not fail the suite.
    });
  }
});

describe("intake_templates write access under RLS", () => {
  it("lets a member create and update a template in their own business", async () => {
    const [a] = tenants;

    const created = await a!.client
      .from("intake_templates")
      .insert({
        business_id: a!.businessId,
        name: `Own ${runId}`,
        work_order_kind: "internal",
      })
      .select("id")
      .single();
    expect(created.error).toBeNull();

    const updated = await a!.client
      .from("intake_templates")
      .update({ is_active: false })
      .eq("id", created.data!.id)
      .select("id, is_active");
    expect(updated.data).toHaveLength(1);
    expect(updated.data?.[0]?.is_active).toBe(false);
  });

  it("rejects creating a template in another tenant", async () => {
    const [a, b] = tenants;

    const { error } = await a!.client.from("intake_templates").insert({
      business_id: b!.businessId,
      name: `Cross ${runId}`,
      work_order_kind: "repair",
    });

    expect(error).not.toBeNull();
  });

  it("cannot see or update another tenant's template", async () => {
    const [a, b] = tenants;

    const visible = await listIntakeTemplates(a!.client, b!.businessId);
    expect(visible).toHaveLength(0);

    const { data } = await a!.client
      .from("intake_templates")
      .update({ name: "hijacked" })
      .eq("id", bTemplateId)
      .select("id");
    expect(data ?? []).toHaveLength(0);
  });

  it("does not grant delete on templates", async () => {
    const [a] = tenants;

    const { error } = await a!.client
      .from("intake_templates")
      .delete()
      .eq("id", aTemplateId);

    // Removal is deactivation: work_orders.intake_template_id is
    // `on delete restrict`, so the grant is withheld on purpose.
    expect(error).not.toBeNull();
  });
});

describe("intake_template_items write access through the parent join", () => {
  it("lets a member add and reorder items on their own template", async () => {
    const [a] = tenants;

    const added = await a!.client
      .from("intake_template_items")
      .insert({
        intake_template_id: aTemplateId,
        item_kind: "section",
        sort_order: 0,
      })
      .select("id")
      .single();
    expect(added.error).toBeNull();

    const moved = await a!.client
      .from("intake_template_items")
      .update({ sort_order: 3 })
      .eq("id", added.data!.id)
      .select("id");
    expect(moved.data).toHaveLength(1);

    const items = await listTemplateItems(a!.client, aTemplateId);
    expect(items.some((item) => item.id === added.data!.id)).toBe(true);
  });

  it("rejects adding an item to another tenant's template", async () => {
    const [a] = tenants;

    // The item table has no business_id -- the policy joins through the parent.
    const { error } = await a!.client.from("intake_template_items").insert({
      intake_template_id: bTemplateId,
      item_kind: "section",
      sort_order: 0,
    });

    expect(error).not.toBeNull();
  });

  it("cannot update or delete another tenant's item", async () => {
    const [a] = tenants;

    const updated = await a!.client
      .from("intake_template_items")
      .update({ field_label: "hijacked" })
      .eq("id", bItemId)
      .select("id");
    expect(updated.data ?? []).toHaveLength(0);

    const deleted = await a!.client
      .from("intake_template_items")
      .delete()
      .eq("id", bItemId)
      .select("id");
    expect(deleted.data ?? []).toHaveLength(0);

    const survives = await admin
      .from("intake_template_items")
      .select("field_label")
      .eq("id", bItemId)
      .single();
    expect(survives.data?.field_label).toBe(`B field ${runId}`);
  });
});

describe("delete restrictions", () => {
  it("refuses to delete a template a work order uses, even as service_role", async () => {
    const [a] = tenants;
    const templateId = await seedTemplate(a!, `Used ${runId}`);

    const order = await admin.from("work_orders").insert({
      business_id: a!.businessId,
      intake_template_id: templateId,
      work_order_kind: "repair",
      number: 1,
    });
    expect(order.error).toBeNull();

    const { error } = await admin
      .from("intake_templates")
      .delete()
      .eq("id", templateId);

    // `on delete restrict` -- this is why the UI deactivates instead.
    expect(error).not.toBeNull();
  });
});
