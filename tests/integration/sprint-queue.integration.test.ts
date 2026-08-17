import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { fetchBoardTasks } from "@/lib/board/queries";
import {
  fetchActiveSprint,
  fetchRecentlyCompletedTasksForStaff,
  fetchSprintCadenceDays,
  fetchStaffMemberIdForUser,
} from "@/lib/sprints/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";
import { generateWorkOrder } from "@/lib/work-orders/generate";
import {
  fetchActiveWorkStages,
  fetchResolvedIntakeItems,
} from "@/lib/work-orders/queries";

import { seedWorkDefinition } from "../../scripts/seed-work-definition.ts";

/**
 * Slice 7 — sprints/business_settings RLS + the query helpers My Work and
 * Sprint Planning read from. Server Actions themselves ("use server",
 * getCurrentUser()) need a Next.js request context and aren't exercised
 * here -- same boundary every other integration test file draws.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const password = "sprint-test-password";

const admin = createAdminClient();

type Tenant = { businessId: string; userId: string; client: SupabaseClient<Database> };

async function seedTenant(label: string): Promise<Tenant> {
  const slug = `sprint-${label}-${runId}`;
  const email = `sprint-${label}-${runId}@wiggy.test`;

  const business = await admin
    .from("businesses")
    .insert({ name: `Sprint ${label} ${runId}`, slug })
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

/** Confirms the seeded "New Wig" intake with one selected task type. */
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
  const handTyingItem = items.find((i) => i.taskType?.name === "קשירה ידנית");

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

describe("sprints RLS", () => {
  it("lets a member create, read, and update their own tenant's sprints", async () => {
    const [a] = tenants;

    const inserted = await a.client
      .from("sprints")
      .insert({
        business_id: a.businessId,
        starts_on: "2026-01-01",
        ends_on: "2026-01-08",
        status: "active",
      })
      .select("id")
      .single();
    expect(inserted.error).toBeNull();

    const updated = await a.client
      .from("sprints")
      .update({ status: "closed" })
      .eq("id", inserted.data!.id)
      .select("status")
      .single();
    expect(updated.error).toBeNull();
    expect(updated.data?.status).toBe("closed");
  });

  it("never lets a tenant see or update another tenant's sprint", async () => {
    const [a, b] = tenants;
    const bSprint = await admin
      .from("sprints")
      .insert({
        business_id: b.businessId,
        starts_on: "2026-01-01",
        ends_on: "2026-01-08",
      })
      .select("id")
      .single();

    const crossRead = await a.client
      .from("sprints")
      .select("id")
      .eq("id", bSprint.data!.id);
    expect(crossRead.data ?? []).toEqual([]);

    const crossUpdate = await a.client
      .from("sprints")
      .update({ status: "closed" })
      .eq("id", bSprint.data!.id)
      .select("id");
    expect(crossUpdate.data ?? []).toEqual([]);
  });
});

describe("business_settings RLS + fetchSprintCadenceDays", () => {
  it("defaults to 7 days when no settings row exists yet", async () => {
    const [, b] = tenants; // untouched tenant
    const days = await fetchSprintCadenceDays(b.client, b.businessId);
    expect(days).toBe(7);
  });

  it("lets a member upsert their tenant's cadence and reads it back", async () => {
    const [a] = tenants;

    const upserted = await a.client
      .from("business_settings")
      .upsert({ business_id: a.businessId, sprint_cadence_days: 14 });
    expect(upserted.error).toBeNull();

    const days = await fetchSprintCadenceDays(a.client, a.businessId);
    expect(days).toBe(14);
  });
});

describe("fetchActiveSprint", () => {
  it("returns the newest non-closed sprint and ignores closed ones", async () => {
    const [, b] = tenants;

    await admin.from("sprints").insert({
      business_id: b.businessId,
      starts_on: "2026-01-01",
      ends_on: "2026-01-08",
      status: "closed",
    });
    const activeInserted = await admin
      .from("sprints")
      .insert({
        business_id: b.businessId,
        starts_on: "2026-02-01",
        ends_on: "2026-02-08",
        status: "active",
      })
      .select("id")
      .single();

    const active = await fetchActiveSprint(b.client, b.businessId);
    expect(active?.id).toBe(activeInserted.data!.id);
    expect(active?.status).toBe("active");
  });

  it("returns null when a tenant has no sprints at all", async () => {
    const fresh = await seedTenant("no-sprints");
    const active = await fetchActiveSprint(fresh.client, fresh.businessId);
    expect(active).toBeNull();
    await admin.from("businesses").delete().eq("id", fresh.businessId);
  });
});

describe("fetchStaffMemberIdForUser", () => {
  it("resolves the staff_members row linked to the current user", async () => {
    const [a] = tenants;
    const { data: staff } = await admin
      .from("staff_members")
      .select("id")
      .eq("business_id", a.businessId)
      .limit(1)
      .single();
    await admin
      .from("staff_members")
      .update({ user_id: a.userId })
      .eq("id", staff!.id);

    const resolved = await fetchStaffMemberIdForUser(a.client, a.businessId, a.userId);
    expect(resolved).toBe(staff!.id);
  });

  it("returns null for a user with no linked staff profile", async () => {
    const [, b] = tenants;
    const resolved = await fetchStaffMemberIdForUser(b.client, b.businessId, b.userId);
    expect(resolved).toBeNull();
  });
});

describe("queue overlay fields on runtime_tasks (sprint_id, queue_rank, priority)", () => {
  it("writes and reads back the sprint/queue overlay for a task", async () => {
    const [a] = tenants;
    const { tasks } = await confirmSeededIntake(a);
    const task = tasks[0];

    const sprint = await a.client
      .from("sprints")
      .insert({
        business_id: a.businessId,
        starts_on: "2026-03-01",
        ends_on: "2026-03-08",
      })
      .select("id")
      .single();
    const { data: staff } = await a.client
      .from("staff_members")
      .select("id")
      .eq("business_id", a.businessId)
      .limit(1)
      .single();

    const updated = await a.client
      .from("runtime_tasks")
      .update({
        sprint_id: sprint.data!.id,
        assigned_staff_member_id: staff!.id,
        queue_rank: 1024,
        priority: true,
      })
      .eq("id", task.id)
      .select("sprint_id, queue_rank, priority")
      .single();
    expect(updated.error).toBeNull();
    expect(updated.data?.sprint_id).toBe(sprint.data!.id);
    expect(updated.data?.queue_rank).toBe(1024);
    expect(updated.data?.priority).toBe(true);

    const boardTasks = await fetchBoardTasks(a.client, a.businessId);
    const found = boardTasks.find((t) => t.id === task.id);
    expect(found?.queue_rank).toBe(1024);
    expect(found?.priority).toBe(true);
  });
});

describe("fetchRecentlyCompletedTasksForStaff", () => {
  it("returns only that staff member's done tasks, enriched with order info", async () => {
    const [a] = tenants;
    const { tasks } = await confirmSeededIntake(a);
    const task = tasks[0];

    const { data: staff } = await a.client
      .from("staff_members")
      .select("id")
      .eq("business_id", a.businessId)
      .limit(1)
      .single();

    await admin
      .from("runtime_tasks")
      .update({
        assigned_staff_member_id: staff!.id,
        status: "done",
        completed_at: new Date().toISOString(),
      })
      .eq("id", task.id);

    const completed = await fetchRecentlyCompletedTasksForStaff(
      a.client,
      a.businessId,
      staff!.id,
    );
    expect(completed).toHaveLength(1);
    expect(completed[0].id).toBe(task.id);
    expect(completed[0].orderNumber).toBeGreaterThan(0);
  });
});
