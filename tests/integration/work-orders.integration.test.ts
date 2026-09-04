import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { generateWorkOrder } from "@/lib/work-orders/generate";
import {
  fetchActiveWorkStages,
  fetchResolvedIntakeItems,
  getWorkOrderWithTasks,
  listWorkOrders,
} from "@/lib/work-orders/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";

import { seedWorkDefinition } from "../../scripts/seed-work-definition.ts";

/**
 * Slice 4 — the intake -> generation loop against local Supabase (RLS in
 * effect): the atomic order-numbering RPC, the full "confirm intake" flow
 * (generate + insert order + insert tasks) using the real seeded "New Wig"
 * catalog, the list/detail queries, and tenant isolation.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const password = "work-orders-test-password";

const admin = createAdminClient();

type Tenant = {
  businessId: string;
  client: SupabaseClient<Database>;
};

async function seedTenant(label: string): Promise<Tenant> {
  const slug = `wo-${label}-${runId}`;
  const email = `wo-${label}-${runId}@wiggy.test`;

  const business = await admin
    .from("businesses")
    .insert({ name: `Work Orders ${label} ${runId}`, slug })
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

/** Mirrors the DB-touching half of createWorkOrderAction, without the
 * Next.js/auth wrapper, for direct integration testing. */
async function confirmIntake(tenant: Tenant, intakeTemplateId: string) {
  const [items, workStages] = await Promise.all([
    fetchResolvedIntakeItems(tenant.client, intakeTemplateId),
    fetchActiveWorkStages(tenant.client, tenant.businessId),
  ]);
  const workStageSortOrderById = Object.fromEntries(
    workStages.map((s) => [s.id, s.sort_order]),
  );
  const fallbackWorkStageId = workStages[0].id;

  const fullColorItem = items.find(
    (i) =>
      i.itemKind === "task_group" &&
      i.taskGroupTaskTypes?.some((tt) => tt.name === "צבע מלא"),
  );
  const handTyingItem = items.find((i) => i.taskType?.name === "עבודת יד");
  const otherItem = items.find((i) => i.config.allow_other);
  const fullColorTaskType = fullColorItem?.taskGroupTaskTypes?.find(
    (tt) => tt.name === "צבע מלא",
  );

  const generated = generateWorkOrder({
    items,
    responses: [
      ...(fullColorItem && fullColorTaskType
        ? [
            {
              itemId: fullColorItem.id,
              selectedGroupTaskTypeIds: [fullColorTaskType.id],
            },
          ]
        : []),
      ...(handTyingItem
        ? [{ itemId: handTyingItem.id, taskTypeSelected: true }]
        : []),
      ...(otherItem
        ? [{ itemId: otherItem.id, otherText: "בדיקת התאמה נוספת" }]
        : []),
    ],
    fallbackWorkStageId,
    workStageSortOrderById,
  });

  const { data: number, error: numberError } = await tenant.client.rpc(
    "next_work_order_number",
    { p_business_id: tenant.businessId },
  );
  if (numberError) throw numberError;

  const { data: template } = await tenant.client
    .from("intake_templates")
    .select("name, work_order_kind")
    .eq("id", intakeTemplateId)
    .single();

  const { data: order, error: orderError } = await tenant.client
    .from("work_orders")
    .insert({
      business_id: tenant.businessId,
      intake_template_id: intakeTemplateId,
      work_order_kind: template!.work_order_kind,
      template_name: template!.name,
      number: number!,
      intake_responses: generated.intakeResponses,
    })
    .select("*")
    .single();
  if (orderError) throw orderError;

  const { error: tasksError } = await tenant.client
    .from("runtime_tasks")
    .insert(
      generated.tasks.map((task) => ({
        business_id: tenant.businessId,
        work_order_id: order.id,
        task_type_id: task.taskTypeId,
        title: task.title,
        description: task.description,
        work_stage_id: task.workStageId,
        sequence_order: task.sequenceOrder,
        requires_approval: task.requiresApproval,
        source: task.source,
        origin_item_id: task.originItemId,
      })),
    );
  if (tasksError) throw tasksError;

  return { order, generated };
}

const tenants: Tenant[] = [];
let templateIdByBusinessId: Record<string, string> = {};

beforeAll(async () => {
  tenants.push(await seedTenant("a"));
  tenants.push(await seedTenant("b"));

  for (const tenant of tenants) {
    const { data: template, error } = await admin
      .from("intake_templates")
      .select("id")
      .eq("business_id", tenant.businessId)
      .eq("name", "פאה חדשה")
      .single();
    if (error) throw error;
    templateIdByBusinessId[tenant.businessId] = template.id;
  }
});

afterAll(async () => {
  for (const tenant of tenants) {
    await admin.from("businesses").delete().eq("id", tenant.businessId);
  }
});

describe("next_work_order_number", () => {
  it("returns a sequential, per-tenant counter starting at 1", async () => {
    const [a] = tenants;
    const templateId = templateIdByBusinessId[a.businessId];

    const first = await confirmIntake(a, templateId);
    const second = await confirmIntake(a, templateId);

    expect(first.order.number).toBe(1);
    expect(second.order.number).toBe(2);
  });

  it("starts a different tenant's counter at 1 independently", async () => {
    const [, b] = tenants;
    const templateId = templateIdByBusinessId[b.businessId];

    const { order } = await confirmIntake(b, templateId);

    expect(order.number).toBe(1);
  });
});

describe("confirm intake -> generated work order + runtime tasks", () => {
  it("creates the order with a JSON snapshot of intake_responses and the template name", async () => {
    const [a] = tenants;
    const templateId = templateIdByBusinessId[a.businessId];

    const { order, generated } = await confirmIntake(a, templateId);

    // The order's display identity is a *snapshot* of the template name, so
    // renaming the template later does not rewrite orders already placed.
    expect(order.template_name).toBe("פאה חדשה");
    expect(order.status).toBe("confirmed");
    expect(order.intake_responses).toEqual(generated.intakeResponses);
    expect(
      (order.intake_responses as { itemId: string; value: string }[]).some(
        (entry) => entry.value === "בדיקת התאמה נוספת",
      ),
    ).toBe(true);
  });

  it("generates runtime_tasks with the right count, snapshot fields, and sequence", async () => {
    const [a] = tenants;
    const templateId = templateIdByBusinessId[a.businessId];

    const { order } = await confirmIntake(a, templateId);

    const { data: tasks, error } = await a.client
      .from("runtime_tasks")
      .select("*")
      .eq("work_order_id", order.id)
      .order("sequence_order", { ascending: true });
    expect(error).toBeNull();

    // 1 full-color + 1 hand-tying + 1 "other" = 3 tasks.
    expect(tasks).toHaveLength(3);
    expect(tasks?.map((t) => t.status)).toEqual([
      "pending",
      "pending",
      "pending",
    ]);
    expect(tasks?.map((t) => t.sequence_order)).toEqual([0, 1, 2]);

    const handTying = tasks?.find((t) => t.title === "עבודת יד");
    expect(handTying).toMatchObject({
      requires_approval: true,
      source: "template",
    });
    expect(handTying?.task_type_id).not.toBeNull();

    const otherTask = tasks?.find((t) => t.source === "other");
    expect(otherTask).toMatchObject({
      task_type_id: null,
      title: "בדיקת התאמה נוספת",
      requires_approval: false,
    });
  });

  it("is queryable via listWorkOrders and getWorkOrderWithTasks", async () => {
    const [a] = tenants;
    const templateId = templateIdByBusinessId[a.businessId];

    const { order } = await confirmIntake(a, templateId);

    const list = await listWorkOrders(a.client, { businessId: a.businessId });
    expect(list.orders.some((o) => o.id === order.id)).toBe(true);

    const detail = await getWorkOrderWithTasks(a.client, order.id);
    expect(detail).not.toBeNull();
    expect(detail?.templateName).toBe("פאה חדשה");
    expect(detail?.tasks.length).toBeGreaterThan(0);
    expect(detail?.tasks[0].workStageName).not.toBe("");
  });
});

describe("work_orders/runtime_tasks tenant isolation", () => {
  it("never lets a tenant read another tenant's orders or tasks", async () => {
    const [a, b] = tenants;
    const templateIdA = templateIdByBusinessId[a.businessId];

    const { order } = await confirmIntake(a, templateIdA);

    const bReadsOrder = await b.client
      .from("work_orders")
      .select("id")
      .eq("id", order.id)
      .maybeSingle();
    expect(bReadsOrder.data).toBeNull();

    const bReadsTasks = await b.client
      .from("runtime_tasks")
      .select("id")
      .eq("work_order_id", order.id);
    expect(bReadsTasks.data).toEqual([]);

    const bList = await listWorkOrders(b.client, { businessId: b.businessId });
    expect(bList.orders.some((o) => o.id === order.id)).toBe(false);
  });

  it("blocks inserting a work order into another tenant's business", async () => {
    const [a, b] = tenants;
    const templateIdB = templateIdByBusinessId[b.businessId];

    const crossInsert = await a.client.from("work_orders").insert({
      business_id: b.businessId,
      intake_template_id: templateIdB,
      work_order_kind: "customer",
      number: 999,
      intake_responses: [],
    });
    expect(crossInsert.error).not.toBeNull();
  });

  it("never lets a tenant increment another tenant's order-number counter", async () => {
    const [a, b] = tenants;

    const crossRpc = await a.client.rpc("next_work_order_number", {
      p_business_id: b.businessId,
    });
    // RLS blocks the insert/update inside the (security invoker) function --
    // it should error, not silently succeed.
    expect(crossRpc.error).not.toBeNull();
  });
});
