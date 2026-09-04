import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { logActivity } from "@/lib/activity/log";
import { fetchActivityForWorkOrder } from "@/lib/activity/queries";
import { fetchAttachmentsForParent } from "@/lib/attachments/queries";
import { fetchCommentsForWorkOrder } from "@/lib/comments/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";
import { recomputeOrderStatus } from "@/lib/work-orders/recompute";
import { getHubData } from "@/lib/work-orders/hub-queries";
import { generateWorkOrder } from "@/lib/work-orders/generate";
import {
  fetchActiveWorkStages,
  fetchResolvedIntakeItems,
} from "@/lib/work-orders/queries";

import { seedWorkDefinition } from "../../scripts/seed-work-definition.ts";

/**
 * Slice 6 — hub tables (task_approvals, task_comments, attachments, activity,
 * missing_items) RLS + the domain helpers that sit on top of them
 * (logActivity, recomputeOrderStatus, getHubData). Server Actions
 * themselves (`"use server"`, `getCurrentUser()`) need a Next.js request
 * context and aren't exercised here -- same boundary board.integration.test
 * and work-orders.integration.test already draw.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const password = "hub-test-password";

const admin = createAdminClient();

type Tenant = { businessId: string; userId: string; client: SupabaseClient<Database> };

async function seedTenant(label: string): Promise<Tenant> {
  const slug = `hub-${label}-${runId}`;
  const email = `hub-${label}-${runId}@wiggy.test`;

  const business = await admin
    .from("businesses")
    .insert({ name: `Hub ${label} ${runId}`, slug })
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

describe("hub tables RLS", () => {
  it("lets a member read/write their own tenant's rows across all five new tables", async () => {
    const [a] = tenants;
    const { orderId, tasks } = await confirmSeededIntake(a);
    const taskId = tasks[0].id;

    const approval = await a.client
      .from("task_approvals")
      .insert({
        business_id: a.businessId,
        runtime_task_id: taskId,
        actor_user_id: a.userId,
        action: "approve",
      })
      .select("id")
      .single();
    expect(approval.error).toBeNull();

    const comment = await a.client
      .from("task_comments")
      .insert({
        business_id: a.businessId,
        runtime_task_id: taskId,
        author_user_id: a.userId,
        body: "test comment",
      })
      .select("id")
      .single();
    expect(comment.error).toBeNull();

    const attachment = await a.client
      .from("attachments")
      .insert({
        business_id: a.businessId,
        kind: "file",
        parent_type: "work_order",
        parent_id: orderId,
        storage_path: `${a.businessId}/work_order/${orderId}/test.txt`,
        file_name: "test.txt",
        uploaded_by: a.userId,
      })
      .select("id")
      .single();
    expect(attachment.error).toBeNull();

    const activityRow = await a.client
      .from("activity")
      .insert({
        business_id: a.businessId,
        actor_user_id: a.userId,
        verb: "task_comment_added",
        subject_type: "runtime_task",
        subject_id: taskId,
        work_order_id: orderId,
      })
      .select("id")
      .single();
    expect(activityRow.error).toBeNull();

    const missingItem = await a.client
      .from("missing_items")
      .insert({
        business_id: a.businessId,
        work_order_id: orderId,
        kind: "top",
        description: "missing a top",
      })
      .select("id")
      .single();
    expect(missingItem.error).toBeNull();

    // activity is append-only: no update grant for authenticated.
    const activityUpdate = await a.client
      .from("activity")
      .update({ verb: "task_created" })
      .eq("id", activityRow.data!.id);
    expect(activityUpdate.error).not.toBeNull();
  });

  it("never lets a tenant see another tenant's hub rows", async () => {
    const [a, b] = tenants;
    const { orderId, tasks } = await confirmSeededIntake(b);
    const taskId = tasks[0].id;

    await admin.from("task_comments").insert({
      business_id: b.businessId,
      runtime_task_id: taskId,
      author_user_id: b.userId,
      body: "tenant b only",
    });
    await admin.from("activity").insert({
      business_id: b.businessId,
      actor_user_id: b.userId,
      verb: "order_created",
      subject_type: "work_order",
      subject_id: orderId,
      work_order_id: orderId,
    });

    const crossComments = await a.client
      .from("task_comments")
      .select("id")
      .eq("runtime_task_id", taskId);
    expect(crossComments.data ?? []).toEqual([]);

    const crossActivity = await a.client
      .from("activity")
      .select("id")
      .eq("work_order_id", orderId);
    expect(crossActivity.data ?? []).toEqual([]);
  });
});

describe("logActivity + fetchActivityForWorkOrder", () => {
  it("writes and reads back an activity entry with the actor's name resolved", async () => {
    const [a] = tenants;
    const { orderId } = await confirmSeededIntake(a);

    await logActivity(a.client, {
      businessId: a.businessId,
      actorUserId: a.userId,
      verb: "order_created",
      subjectType: "work_order",
      subjectId: orderId,
      workOrderId: orderId,
      payload: { taskCount: 1 },
    });

    const entries = await fetchActivityForWorkOrder(a.client, orderId);
    expect(entries.length).toBeGreaterThan(0);
    expect(entries[0].verb).toBe("order_created");
    expect(entries[0].payload).toMatchObject({ taskCount: 1 });
  });
});

describe("recomputeOrderStatus", () => {
  it("moves confirmed -> active -> ready_for_handoff as tasks progress", async () => {
    const [a] = tenants;
    const { orderId, tasks } = await confirmSeededIntake(a);

    let order = await admin
      .from("work_orders")
      .select("status")
      .eq("id", orderId)
      .single();
    expect(order.data?.status).toBe("confirmed");

    await admin
      .from("runtime_tasks")
      .update({ status: "in_progress" })
      .eq("id", tasks[0].id);
    await recomputeOrderStatus(a.client, orderId);
    order = await admin.from("work_orders").select("status").eq("id", orderId).single();
    expect(order.data?.status).toBe("active");

    await admin.from("runtime_tasks").update({ status: "done" }).eq("id", tasks[0].id);
    await recomputeOrderStatus(a.client, orderId);
    order = await admin.from("work_orders").select("status").eq("id", orderId).single();
    expect(order.data?.status).toBe("ready_for_handoff");
  });

  it("never reopens a manually completed/cancelled order", async () => {
    const [a] = tenants;
    const { orderId, tasks } = await confirmSeededIntake(a);

    await admin.from("work_orders").update({ status: "completed" }).eq("id", orderId);
    await admin
      .from("runtime_tasks")
      .update({ status: "in_progress" })
      .eq("id", tasks[0].id);

    await recomputeOrderStatus(a.client, orderId);
    const order = await admin
      .from("work_orders")
      .select("status")
      .eq("id", orderId)
      .single();
    expect(order.data?.status).toBe("completed");
  });
});

describe("comments + attachments queries", () => {
  it("fetchCommentsForWorkOrder tags each comment with its task title", async () => {
    const [a] = tenants;
    const { orderId, tasks } = await confirmSeededIntake(a);

    await admin.from("task_comments").insert({
      business_id: a.businessId,
      runtime_task_id: tasks[0].id,
      author_user_id: a.userId,
      body: "check the color match",
    });

    const comments = await fetchCommentsForWorkOrder(a.client, orderId);
    expect(comments).toHaveLength(1);
    expect(comments[0].body).toBe("check the color match");
    expect(comments[0].taskTitle).toBe(tasks[0].title);
    expect(comments[0].author_user_id).toBe(a.userId);
  });

  it("fetchAttachmentsForParent resolves a signed URL for each row", async () => {
    const [a] = tenants;
    const { orderId } = await confirmSeededIntake(a);
    const storagePath = `${a.businessId}/work_order/${orderId}/note.txt`;

    await admin.storage
      .from("attachments")
      .upload(storagePath, new Blob(["hello"], { type: "text/plain" }), {
        upsert: true,
      });
    await admin.from("attachments").insert({
      business_id: a.businessId,
      kind: "file",
      parent_type: "work_order",
      parent_id: orderId,
      storage_path: storagePath,
      file_name: "note.txt",
      uploaded_by: a.userId,
    });

    const attachments = await fetchAttachmentsForParent(a.client, "work_order", orderId);
    expect(attachments).toHaveLength(1);
    expect(attachments[0].url).toBeTruthy();
  });
});

describe("getHubData", () => {
  it("aggregates order, tasks, staff, and task types for the hub page", async () => {
    const [a] = tenants;
    const { orderId } = await confirmSeededIntake(a);

    const data = await getHubData(a.client, a.businessId, orderId);
    expect(data).not.toBeNull();
    expect(data!.order.id).toBe(orderId);
    expect(data!.tasks.length).toBeGreaterThan(0);
    expect(data!.tasks[0].workStageName).toBeTruthy();
    expect(data!.staff.length).toBeGreaterThan(0);
    expect(data!.taskTypes.length).toBeGreaterThan(0);
  });

  it("returns null for an unknown work order id", async () => {
    const [a] = tenants;
    const data = await getHubData(
      a.client,
      a.businessId,
      "00000000-0000-0000-0000-000000000000",
    );
    expect(data).toBeNull();
  });
});
