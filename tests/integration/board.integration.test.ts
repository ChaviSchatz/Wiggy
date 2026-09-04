import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { computeAvailability } from "@/lib/availability";
import { fetchBoardTasks } from "@/lib/board/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";
import { generateWorkOrder } from "@/lib/work-orders/generate";
import {
  fetchActiveWorkStages,
  fetchResolvedIntakeItems,
} from "@/lib/work-orders/queries";

import { seedWorkDefinition } from "../../scripts/seed-work-definition.ts";

/**
 * Slice 5 — production board: the runtime_tasks UPDATE grant/RLS added this
 * slice, and fetchBoardTasks/computeAvailability against real generated
 * tasks (reusing the Slice 4 confirm-intake path).
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const password = "board-test-password";

const admin = createAdminClient();

type Tenant = { businessId: string; client: SupabaseClient<Database> };

async function seedTenant(label: string): Promise<Tenant> {
  const slug = `board-${label}-${runId}`;
  const email = `board-${label}-${runId}@wiggy.test`;

  const business = await admin
    .from("businesses")
    .insert({ name: `Board ${label} ${runId}`, slug })
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

/** Confirms the seeded "New Wig" intake with two selected task types, so the
 * order has at least two sequenced tasks to test availability with. */
async function confirmSeededIntake(tenant: Tenant) {
  const { data: template, error: templateError } = await admin
    .from("intake_templates")
    .select("id, work_order_kind")
    .eq("business_id", tenant.businessId)
    .eq("name", "פאה חדשה")
    .single();
  if (templateError) throw templateError;

  const [items, workStages] = await Promise.all([
    fetchResolvedIntakeItems(tenant.client, template.id),
    fetchActiveWorkStages(tenant.client, tenant.businessId),
  ]);
  const workStageSortOrderById = Object.fromEntries(
    workStages.map((s) => [s.id, s.sort_order]),
  );
  const handTyingItem = items.find((i) => i.taskType?.name === "עבודת יד");

  const generated = generateWorkOrder({
    items,
    responses: handTyingItem
      ? [{ itemId: handTyingItem.id, taskTypeSelected: true }]
      : [],
    fallbackWorkStageId: workStages[0].id,
    workStageSortOrderById,
  });

  const { data: number } = await tenant.client.rpc("next_work_order_number", {
    p_business_id: tenant.businessId,
  });

  const { data: order, error: orderError } = await tenant.client
    .from("work_orders")
    .insert({
      business_id: tenant.businessId,
      intake_template_id: template.id,
      work_order_kind: template.work_order_kind,
      number: number!,
      intake_responses: generated.intakeResponses,
    })
    .select("id")
    .single();
  if (orderError) throw orderError;

  const { data: insertedTasks, error: tasksError } = await tenant.client
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
    )
    .select("*");
  if (tasksError) throw tasksError;

  return { orderId: order.id, tasks: insertedTasks! };
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

describe("fetchBoardTasks", () => {
  it("returns enriched, live-only tasks with order/customer/staff/task-type data", async () => {
    const [a] = tenants;
    const { tasks } = await confirmSeededIntake(a);
    expect(tasks.length).toBeGreaterThan(0);

    const boardTasks = await fetchBoardTasks(a.client, a.businessId);
    const found = boardTasks.find((t) => t.id === tasks[0].id);
    expect(found).toBeDefined();
    expect(found?.orderNumber).toBeGreaterThan(0);
    expect(found?.customerName).toBeNull(); // no customer on this order
    expect(found?.taskTypeName).toBe("עבודת יד");
  });

  it("excludes terminal-status tasks (done/skipped/cancelled) from the board", async () => {
    const [a] = tenants;
    const { tasks } = await confirmSeededIntake(a);

    await admin
      .from("runtime_tasks")
      .update({ status: "done" })
      .eq("id", tasks[0].id);

    const boardTasks = await fetchBoardTasks(a.client, a.businessId);
    expect(boardTasks.some((t) => t.id === tasks[0].id)).toBe(false);
  });
});

describe("runtime_tasks UPDATE under RLS (added this slice)", () => {
  it("lets a member start, complete, reassign, and override their own tenant's task", async () => {
    const [a] = tenants;
    const { tasks } = await confirmSeededIntake(a);
    const task = tasks[0];

    const started = await a.client
      .from("runtime_tasks")
      .update({ status: "in_progress", started_at: new Date().toISOString() })
      .eq("id", task.id)
      .select("status")
      .single();
    expect(started.error).toBeNull();
    expect(started.data?.status).toBe("in_progress");

    const { data: staff } = await a.client
      .from("staff_members")
      .select("id")
      .eq("business_id", a.businessId)
      .limit(1)
      .single();

    const reassigned = await a.client
      .from("runtime_tasks")
      .update({ assigned_staff_member_id: staff!.id })
      .eq("id", task.id)
      .select("assigned_staff_member_id")
      .single();
    expect(reassigned.error).toBeNull();
    expect(reassigned.data?.assigned_staff_member_id).toBe(staff!.id);

    const overridden = await a.client
      .from("runtime_tasks")
      .update({ availability_override: true })
      .eq("id", task.id)
      .select("availability_override")
      .single();
    expect(overridden.error).toBeNull();
    expect(overridden.data?.availability_override).toBe(true);
  });

  it("never lets a tenant update another tenant's task", async () => {
    const [a, b] = tenants;
    const { tasks } = await confirmSeededIntake(b);

    const crossUpdate = await a.client
      .from("runtime_tasks")
      .update({ status: "in_progress" })
      .eq("id", tasks[0].id)
      .select("id");
    expect(crossUpdate.error).toBeNull();
    expect(crossUpdate.data ?? []).toEqual([]);

    const stillPending = await admin
      .from("runtime_tasks")
      .select("status")
      .eq("id", tasks[0].id)
      .single();
    expect(stillPending.data?.status).toBe("pending");
  });
});

describe("availability end to end", () => {
  it("blocks a later task until its predecessor resolves, matching the live DB rows", async () => {
    const [a] = tenants;

    // Two selections in the same order -> two sequenced tasks.
    const { data: template } = await admin
      .from("intake_templates")
      .select("id, work_order_kind")
      .eq("business_id", a.businessId)
      .eq("name", "פאה חדשה")
      .single();
    const items = await fetchResolvedIntakeItems(a.client, template!.id);
    const workStages = await fetchActiveWorkStages(a.client, a.businessId);
    const workStageSortOrderById = Object.fromEntries(
      workStages.map((s) => [s.id, s.sort_order]),
    );
    const washGroupItem = items.find((i) =>
      i.taskGroupTaskTypes?.some((tt) => tt.name === "שטיפה"),
    );
    const washTaskType = washGroupItem?.taskGroupTaskTypes?.find(
      (tt) => tt.name === "שטיפה",
    );
    const handTyingItem = items.find((i) => i.taskType?.name === "עבודת יד");

    const generated = generateWorkOrder({
      items,
      responses: [
        ...(handTyingItem
          ? [{ itemId: handTyingItem.id, taskTypeSelected: true }]
          : []),
        ...(washGroupItem && washTaskType
          ? [
              {
                itemId: washGroupItem.id,
                selectedGroupTaskTypeIds: [washTaskType.id],
              },
            ]
          : []),
      ],
      fallbackWorkStageId: workStages[0].id,
      workStageSortOrderById,
    });
    expect(generated.tasks.length).toBe(2);

    const { data: number } = await a.client.rpc("next_work_order_number", {
      p_business_id: a.businessId,
    });
    const { data: order } = await a.client
      .from("work_orders")
      .insert({
        business_id: a.businessId,
        intake_template_id: template!.id,
        work_order_kind: template!.work_order_kind,
        number: number!,
        intake_responses: generated.intakeResponses,
      })
      .select("id")
      .single();
    await a.client.from("runtime_tasks").insert(
      generated.tasks.map((task) => ({
        business_id: a.businessId,
        work_order_id: order!.id,
        task_type_id: task.taskTypeId,
        title: task.title,
        work_stage_id: task.workStageId,
        sequence_order: task.sequenceOrder,
        requires_approval: task.requiresApproval,
        source: task.source,
        origin_item_id: task.originItemId,
      })),
    );

    const boardTasks = await fetchBoardTasks(a.client, a.businessId);
    const orderTasks = boardTasks
      .filter((t) => t.work_order_id === order!.id)
      .sort((x, y) => x.sequence_order - y.sequence_order);
    expect(orderTasks).toHaveLength(2);

    let availability = computeAvailability(
      boardTasks.map((t) => ({
        id: t.id,
        workOrderId: t.work_order_id,
        sequenceOrder: t.sequence_order,
        status: t.status as never,
        availabilityOverride: t.availability_override,
      })),
    );
    expect(availability.get(orderTasks[0].id)).toBe("available");
    expect(availability.get(orderTasks[1].id)).toBe("blocked");

    // Resolve the first task -> the second becomes available.
    await a.client
      .from("runtime_tasks")
      .update({ status: "done" })
      .eq("id", orderTasks[0].id);
    const afterFirstDone = (
      await fetchBoardTasks(a.client, a.businessId)
    ).filter((t) => t.work_order_id === order!.id);
    expect(afterFirstDone).toHaveLength(1); // the done one drops off the live board
    availability = computeAvailability(
      afterFirstDone.map((t) => ({
        id: t.id,
        workOrderId: t.work_order_id,
        sequenceOrder: t.sequence_order,
        status: t.status as never,
        availabilityOverride: t.availability_override,
      })),
    );
    expect(availability.get(orderTasks[1].id)).toBe("available");
  });
});
