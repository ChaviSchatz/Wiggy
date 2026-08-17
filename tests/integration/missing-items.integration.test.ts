import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  countUnhandledMissingItems,
  fetchMissingItemOrderOptions,
  listMissingItems,
} from "@/lib/missing-items/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";
import { generateWorkOrder } from "@/lib/work-orders/generate";
import {
  fetchActiveWorkStages,
  fetchResolvedIntakeItems,
} from "@/lib/work-orders/queries";

import { seedWorkDefinition } from "../../scripts/seed-work-definition.ts";

/**
 * Slice 8 — missing-items queries + `feedback_items` RLS, against real data.
 * Server Actions themselves (`"use server"`, `getCurrentUser()`) need a
 * Next.js request context and aren't exercised here -- the same boundary the
 * other integration suites draw.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const password = "missing-items-test-password";

const admin = createAdminClient();

type Tenant = {
  businessId: string;
  userId: string;
  client: SupabaseClient<Database>;
};

async function seedTenant(label: string): Promise<Tenant> {
  const slug = `missing-${label}-${runId}`;
  const email = `missing-${label}-${runId}@wiggy.test`;

  const business = await admin
    .from("businesses")
    .insert({ name: `Missing ${label} ${runId}`, slug })
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

  return { businessId: business.data.id, userId: user.data.user.id, client };
}

async function createOrder(
  tenant: Tenant,
  { status = "confirmed" }: { status?: string } = {},
): Promise<string> {
  const template = await admin
    .from("intake_templates")
    .select("id, work_order_kind")
    .eq("business_id", tenant.businessId)
    .eq("name", "פאה חדשה")
    .single();
  if (template.error) throw template.error;

  const { data: number } = await tenant.client.rpc("next_work_order_number", {
    p_business_id: tenant.businessId,
  });

  const order = await tenant.client
    .from("work_orders")
    .insert({
      business_id: tenant.businessId,
      intake_template_id: template.data.id,
      work_order_kind: template.data.work_order_kind,
      number: number!,
      status,
    })
    .select("id")
    .single();
  if (order.error) throw order.error;
  return order.data.id;
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

describe("missing-items queries", () => {
  it("lists unhandled items with their order, customer and responsible names", async () => {
    const [a] = tenants;
    const orderId = await createOrder(a);

    const customer = await a.client
      .from("customers")
      .insert({ business_id: a.businessId, name: `לקוחה ${runId}` })
      .select("id")
      .single();
    if (customer.error) throw customer.error;
    await a.client
      .from("work_orders")
      .update({ customer_id: customer.data.id })
      .eq("id", orderId);

    const staff = await a.client
      .from("staff_members")
      .select("id, full_name")
      .eq("business_id", a.businessId)
      .limit(1)
      .single();
    if (staff.error) throw staff.error;

    const inserted = await a.client
      .from("missing_items")
      .insert([
        {
          business_id: a.businessId,
          work_order_id: orderId,
          kind: "top",
          status: "open",
          description: "טופ 40",
          responsible_staff_member_id: staff.data.id,
        },
        {
          business_id: a.businessId,
          work_order_id: orderId,
          kind: "skin",
          status: "handled",
          handled_at: new Date().toISOString(),
        },
      ])
      .select("id");
    expect(inserted.error).toBeNull();

    const unhandled = await listMissingItems(a.client, {
      businessId: a.businessId,
      status: "unhandled",
    });
    expect(unhandled.items.map((item) => item.kind)).toEqual(["top"]);
    expect(unhandled.items[0]).toMatchObject({
      description: "טופ 40",
      customerName: `לקוחה ${runId}`,
      responsibleName: staff.data.full_name,
    });
    expect(unhandled.items[0].orderNumber).toBeGreaterThan(0);

    const handled = await listMissingItems(a.client, {
      businessId: a.businessId,
      status: "handled",
    });
    expect(handled.items.map((item) => item.kind)).toEqual(["skin"]);

    const byKind = await listMissingItems(a.client, {
      businessId: a.businessId,
      status: "unhandled",
      kind: "material",
    });
    expect(byKind.items).toEqual([]);

    const byResponsible = await listMissingItems(a.client, {
      businessId: a.businessId,
      status: "unhandled",
      responsibleStaffMemberId: staff.data.id,
    });
    expect(byResponsible.total).toBe(1);
  });

  it("stops counting an item once its order is completed", async () => {
    const [, b] = tenants;
    const orderId = await createOrder(b);
    await b.client.from("missing_items").insert({
      business_id: b.businessId,
      work_order_id: orderId,
      kind: "material",
    });

    expect(await countUnhandledMissingItems(b.client, b.businessId)).toBe(1);

    await b.client
      .from("work_orders")
      .update({ status: "completed" })
      .eq("id", orderId);

    expect(await countUnhandledMissingItems(b.client, b.businessId)).toBe(0);
    // The row itself is still there -- it just stopped being an alert.
    const all = await listMissingItems(b.client, {
      businessId: b.businessId,
      status: "unhandled",
    });
    expect(all.total).toBe(1);
    const activeOnly = await listMissingItems(b.client, {
      businessId: b.businessId,
      status: "unhandled",
      activeOrdersOnly: true,
    });
    expect(activeOnly.total).toBe(0);
  });

  it("offers only live orders when creating an item manually", async () => {
    const [, b] = tenants;
    const openOrderId = await createOrder(b);

    const options = await fetchMissingItemOrderOptions(b.client, b.businessId);
    const ids = options.map((option) => option.id);
    expect(ids).toContain(openOrderId);
    // The order completed by the previous test must not be offered.
    const completed = await b.client
      .from("work_orders")
      .select("id")
      .eq("business_id", b.businessId)
      .eq("status", "completed");
    for (const order of completed.data ?? []) {
      expect(ids).not.toContain(order.id);
    }
  });

  it("never lets a tenant see another tenant's missing items", async () => {
    const [a, b] = tenants;
    const orderId = await createOrder(a);
    await admin.from("missing_items").insert({
      business_id: a.businessId,
      work_order_id: orderId,
      kind: "top",
      description: `secret-${runId}`,
    });

    const leaked = await b.client
      .from("missing_items")
      .select("id")
      .eq("description", `secret-${runId}`);
    expect(leaked.data).toEqual([]);

    const crossTenantInsert = await b.client.from("missing_items").insert({
      business_id: a.businessId,
      work_order_id: orderId,
      kind: "skin",
    });
    expect(crossTenantInsert.error).not.toBeNull();
  });
});

describe("intake-flagged missing items", () => {
  it("turns an answered no_top flag into a missing item on the confirmed order", async () => {
    const [a] = tenants;

    const template = await admin
      .from("intake_templates")
      .select("id")
      .eq("business_id", a.businessId)
      .eq("name", "פאה חדשה")
      .single();
    if (template.error) throw template.error;

    const [items, workStages] = await Promise.all([
      fetchResolvedIntakeItems(a.client, template.data.id),
      fetchActiveWorkStages(a.client, a.businessId),
    ]);
    const noTopItem = items.find((item) => item.fieldKey === "no_top");
    expect(noTopItem).toBeDefined();
    expect(noTopItem?.config.missing_item_kind).toBe("top");

    const generated = generateWorkOrder({
      items,
      responses: [{ itemId: noTopItem!.id, fieldValue: "כן" }],
      fallbackWorkStageId: workStages[0].id,
      workStageSortOrderById: Object.fromEntries(
        workStages.map((stage) => [stage.id, stage.sort_order]),
      ),
    });
    expect(generated.missingItems).toEqual([
      { kind: "top", description: "אין טופ במלאי", originItemId: noTopItem!.id },
    ]);

    const orderId = await createOrder(a);
    const inserted = await a.client
      .from("missing_items")
      .insert(
        generated.missingItems.map((missing) => ({
          business_id: a.businessId,
          work_order_id: orderId,
          kind: missing.kind,
          description: missing.description,
        })),
      )
      .select("id, status, kind");
    expect(inserted.error).toBeNull();
    expect(inserted.data).toHaveLength(1);
    expect(inserted.data![0]).toMatchObject({ kind: "top", status: "open" });
  });
});

describe("feedback_items RLS", () => {
  it("lets a member submit and read their own tenant's feedback", async () => {
    const [a] = tenants;

    const inserted = await a.client
      .from("feedback_items")
      .insert({
        business_id: a.businessId,
        submitted_by: a.userId,
        kind: "bug",
        message: `feedback-${runId}`,
        page_path: "/board",
      })
      .select("id")
      .single();
    expect(inserted.error).toBeNull();

    const read = await a.client
      .from("feedback_items")
      .select("kind, message, page_path")
      .eq("id", inserted.data!.id)
      .single();
    expect(read.data).toMatchObject({
      kind: "bug",
      message: `feedback-${runId}`,
      page_path: "/board",
    });

    // Append-only in v1: no update grant for `authenticated`.
    const update = await a.client
      .from("feedback_items")
      .update({ message: "edited" })
      .eq("id", inserted.data!.id);
    expect(update.error).not.toBeNull();
  });

  it("rejects an unknown feedback kind at the database level", async () => {
    const [a] = tenants;
    const inserted = await a.client.from("feedback_items").insert({
      business_id: a.businessId,
      submitted_by: a.userId,
      kind: "praise",
      message: "nice",
    });
    expect(inserted.error).not.toBeNull();
  });

  it("never lets a tenant read another tenant's feedback", async () => {
    const [a, b] = tenants;
    await admin.from("feedback_items").insert({
      business_id: a.businessId,
      submitted_by: a.userId,
      kind: "question",
      message: `secret-feedback-${runId}`,
    });

    const leaked = await b.client
      .from("feedback_items")
      .select("id")
      .eq("message", `secret-feedback-${runId}`);
    expect(leaked.data).toEqual([]);
  });
});
