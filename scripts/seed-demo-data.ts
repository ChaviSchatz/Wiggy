/**
 * Idempotent demo-data seed: customers, generated work orders (via the real
 * `generateWorkOrder` algorithm), and runtime tasks nudged into a realistic
 * spread of states so the Board, Sprint Planning, My Work, and Approvals
 * screens all show something meaningful right after `npm run seed:dev`.
 *
 * Run with: npm run seed:demo (requires `seed:dev` to have run first --
 * reuses its business/catalog/staff/admin rows).
 *
 * Uses the service-role admin client (bypasses RLS), same pattern as
 * `seed-dev.ts`. Safe to run repeatedly: each demo customer is looked up by
 * name first, and a customer with an existing work order is left alone
 * (this script never creates a second order for the same demo customer).
 */
import { createAdminClient } from "../src/lib/supabase/admin.ts";
import { generateWorkOrder } from "../src/lib/work-orders/generate.ts";
import {
  fetchActiveWorkStages,
  fetchResolvedIntakeItems,
} from "../src/lib/work-orders/queries.ts";
import { deriveOrderStatus } from "../src/lib/work-orders/status.ts";
import { rankAfter } from "../src/lib/queue/rank.ts";
import type { ItemResponse } from "../src/lib/work-orders/types.ts";

const BUSINESS_SLUG = "wiggy-dev";
const TEMPLATE_NAME = "פאה חדשה";
const WORKER_EMAIL = "worker@wiggy.local";
const WORKER_PASSWORD = "wiggy-dev-password";
const WORKER_NAME = "דנה כהן";

type AdminClient = ReturnType<typeof createAdminClient>;

async function main() {
  const supabase = createAdminClient();

  const business = await supabase
    .from("businesses")
    .select("id")
    .eq("slug", BUSINESS_SLUG)
    .maybeSingle();
  if (business.error) throw business.error;
  if (!business.data) {
    throw new Error(
      `Business "${BUSINESS_SLUG}" not found -- run "npm run seed:dev" first.`,
    );
  }
  const businessId = business.data.id;

  const template = await supabase
    .from("intake_templates")
    .select("id")
    .eq("business_id", businessId)
    .eq("name", TEMPLATE_NAME)
    .maybeSingle();
  if (template.error) throw template.error;
  if (!template.data) {
    throw new Error(
      `Intake template "${TEMPLATE_NAME}" not found -- run "npm run seed:dev" first.`,
    );
  }
  const templateId = template.data.id;

  const stages = await fetchActiveWorkStages(supabase, businessId);
  const fallbackWorkStageId = stages[0]!.id;
  const workStageSortOrderById = Object.fromEntries(
    stages.map((s) => [s.id, s.sort_order]),
  );

  const staffResult = await supabase
    .from("staff_members")
    .select("id, full_name")
    .eq("business_id", businessId);
  if (staffResult.error) throw staffResult.error;
  const staffIdByName = new Map(
    (staffResult.data ?? []).map((s) => [s.full_name, s.id]),
  );
  const handTyingLeadId = requireStaff(staffIdByName, "דנה כהן");
  const sewingLeadId = requireStaff(staffIdByName, "יוסי לוי");
  const colorLeadId = requireStaff(staffIdByName, "מיכל בר");

  const items = await fetchResolvedIntakeItems(supabase, templateId);
  const colorGroupItem = items.find(
    (i) =>
      i.itemKind === "task_group" &&
      i.taskGroupTaskTypes?.some((t) => t.name === "צבע מלא"),
  );
  const washGroupItem = items.find(
    (i) =>
      i.itemKind === "task_group" &&
      i.taskGroupTaskTypes?.some((t) => t.name === "שטיפה"),
  );
  const handTyingItem = items.find(
    (i) => i.itemKind === "task_type" && i.taskType?.name === "קשירה ידנית",
  );
  // The "no top in stock" missing-stock flag (architecture §6.5) -- answering it
  // is what gives /missing-items and the dashboard alert something to show.
  const noTopItem = items.find((i) => i.fieldKey === "no_top");
  if (!colorGroupItem || !washGroupItem || !handTyingItem || !noTopItem) {
    throw new Error(
      "Expected intake template items not found -- has the catalog changed?",
    );
  }
  const taskTypeIdByName = (
    group: NonNullable<typeof colorGroupItem>,
    name: string,
  ) => {
    const id = group.taskGroupTaskTypes!.find((t) => t.name === name)?.id;
    if (!id) throw new Error(`Task type "${name}" not found in group.`);
    return id;
  };
  const fullColorId = taskTypeIdByName(colorGroupItem, "צבע מלא");
  const rootsId = taskTypeIdByName(colorGroupItem, "שורשים");
  const highlightsId = taskTypeIdByName(colorGroupItem, "הדגשות");
  const washId = taskTypeIdByName(washGroupItem, "שטיפה");
  const stylingId = taskTypeIdByName(washGroupItem, "עיצוב");

  // 1. An active sprint (idempotent: reuse any non-closed sprint).
  const activeSprint = await supabase
    .from("sprints")
    .select("id")
    .eq("business_id", businessId)
    .neq("status", "closed")
    .maybeSingle();
  if (activeSprint.error) throw activeSprint.error;

  let sprintId = activeSprint.data?.id ?? null;
  if (!sprintId) {
    const startsOn = new Date();
    const endsOn = new Date(startsOn);
    endsOn.setDate(endsOn.getDate() + 7);
    const inserted = await supabase
      .from("sprints")
      .insert({
        business_id: businessId,
        name: "ספרינט נוכחי",
        starts_on: startsOn.toISOString().slice(0, 10),
        ends_on: endsOn.toISOString().slice(0, 10),
        status: "active",
      })
      .select("id")
      .single();
    if (inserted.error) throw inserted.error;
    sprintId = inserted.data.id;
    console.log(`Created active sprint (${sprintId}).`);
  } else {
    console.log(`Active sprint already exists (${sprintId}).`);
  }

  // 2. A worker login linked to "דנה כהן" so /my-work has something to log
  // into directly, without overloading the admin account as a floor worker.
  let workerUserId = await findUserIdByEmail(supabase, WORKER_EMAIL);
  if (!workerUserId) {
    const created = await supabase.auth.admin.createUser({
      email: WORKER_EMAIL,
      password: WORKER_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: WORKER_NAME },
    });
    if (created.error) throw created.error;
    workerUserId = created.data.user.id;
    console.log(`Created worker user ${WORKER_EMAIL} (${workerUserId}).`);
  } else {
    console.log(`Worker user ${WORKER_EMAIL} already exists (${workerUserId}).`);
  }
  // The `handle_new_user` trigger only sets id + email; without a full_name
  // the app's first-login bootstrap flow (src/app/(auth)/bootstrap) would
  // otherwise redirect every /my-work request here, same as seed-dev.ts.
  const workerProfile = await supabase
    .from("profiles")
    .update({ full_name: WORKER_NAME })
    .eq("id", workerUserId);
  if (workerProfile.error) throw workerProfile.error;
  const workerMembership = await supabase
    .from("memberships")
    .upsert(
      { user_id: workerUserId, business_id: businessId, role: "worker" },
      { onConflict: "user_id,business_id" },
    );
  if (workerMembership.error) throw workerMembership.error;
  const linkStaff = await supabase
    .from("staff_members")
    .update({ user_id: workerUserId })
    .eq("id", handTyingLeadId);
  if (linkStaff.error) throw linkStaff.error;
  console.log(`Linked ${WORKER_EMAIL} to staff member "${WORKER_NAME}".`);

  // 3. Demo customers + generated work orders in varied states.
  await ensureDemoOrder(supabase, {
    businessId,
    templateId,
    items,
    fallbackWorkStageId,
    workStageSortOrderById,
    customerName: "רונית אברהם",
    phone: "050-1234567",
    priority: "urgent",
    dueInDays: 3,
    responses: [
      { itemId: colorGroupItem.id, selectedGroupTaskTypeIds: [fullColorId] },
      { itemId: handTyingItem.id, taskTypeSelected: true },
      {
        itemId: washGroupItem.id,
        selectedGroupTaskTypeIds: [washId, stylingId],
      },
      // Flags a missing top -> one `missing_items` row on this order.
      { itemId: noTopItem.id, fieldValue: "כן" },
    ],
    applyState: async (tasksBySequence) => {
      // seq0 = hand tying (done), seq1 = full color (awaiting approval --
      // shows up on /approvals), seq2/3 = wash/styling (blocked behind it).
      await updateTask(supabase, tasksBySequence[0]!.id, {
        status: "done",
        assigned_staff_member_id: handTyingLeadId,
        started_at: hoursAgo(30),
        completed_at: hoursAgo(6),
      });
      await updateTask(supabase, tasksBySequence[1]!.id, {
        status: "awaiting_approval",
        assigned_staff_member_id: colorLeadId,
        started_at: hoursAgo(5),
        sprint_id: sprintId,
        queue_rank: rankAfter(null),
      });
    },
  });

  await ensureDemoOrder(supabase, {
    businessId,
    templateId,
    items,
    fallbackWorkStageId,
    workStageSortOrderById,
    customerName: "שירה גולן",
    phone: "050-2345678",
    responses: [
      { itemId: handTyingItem.id, taskTypeSelected: true },
      {
        itemId: washGroupItem.id,
        selectedGroupTaskTypeIds: [washId, stylingId],
      },
    ],
    applyState: async (tasksBySequence) => {
      // seq0 = hand tying (in progress -- "current" in My Work for the
      // worker login), seq1/2 = wash/styling assigned+queued for sewing lead.
      await updateTask(supabase, tasksBySequence[0]!.id, {
        status: "in_progress",
        assigned_staff_member_id: handTyingLeadId,
        started_at: hoursAgo(1),
        sprint_id: sprintId,
        queue_rank: rankAfter(null),
      });
      await updateTask(supabase, tasksBySequence[1]!.id, {
        assigned_staff_member_id: sewingLeadId,
        sprint_id: sprintId,
        queue_rank: rankAfter(null),
      });
      await updateTask(supabase, tasksBySequence[2]!.id, {
        assigned_staff_member_id: sewingLeadId,
        sprint_id: sprintId,
        queue_rank: rankAfter(rankAfter(null)),
        priority: true,
      });
    },
  });

  await ensureDemoOrder(supabase, {
    businessId,
    templateId,
    items,
    fallbackWorkStageId,
    workStageSortOrderById,
    customerName: "טל מזרחי",
    phone: "050-3456789",
    dueInDays: 5,
    responses: [
      {
        itemId: colorGroupItem.id,
        selectedGroupTaskTypeIds: [rootsId, highlightsId],
      },
      { itemId: noTopItem.id, fieldValue: "כן" },
    ],
    applyState: async () => {
      // Left as two unassigned `pending` tasks (seq0 available, seq1
      // sequence-blocked) in the sprint backlog -- a ready-to-assign demo.
    },
  });

  await ensureDemoOrder(supabase, {
    businessId,
    templateId,
    items,
    fallbackWorkStageId,
    workStageSortOrderById,
    customerName: "נועה שפירא",
    phone: "050-4567890",
    responses: [{ itemId: handTyingItem.id, taskTypeSelected: true }],
    applyState: async (tasksBySequence) => {
      // A fully completed order -- shows as "ready for handoff" in the list.
      await updateTask(supabase, tasksBySequence[0]!.id, {
        status: "done",
        assigned_staff_member_id: handTyingLeadId,
        started_at: hoursAgo(50),
        completed_at: hoursAgo(48),
      });
    },
  });

  await ensureDemoMissingItem(supabase, businessId, sewingLeadId);

  console.log("\nDemo data seed complete.");
  console.log(`  Worker login: ${WORKER_EMAIL} / ${WORKER_PASSWORD}`);
}

/**
 * Guarantees at least one unhandled missing item, so /missing-items and the
 * dashboard alert are populated even on a business seeded before the intake
 * flags existed (where every demo order already exists and is skipped).
 */
async function ensureDemoMissingItem(
  supabase: AdminClient,
  businessId: string,
  responsibleStaffMemberId: string,
) {
  const existing = await supabase
    .from("missing_items")
    .select("id")
    .eq("business_id", businessId)
    .neq("status", "handled")
    .limit(1);
  if (existing.error) throw existing.error;
  if ((existing.data ?? []).length > 0) {
    console.log("Missing item already exists -- skipping.");
    return;
  }

  const order = await supabase
    .from("work_orders")
    .select("id")
    .eq("business_id", businessId)
    .not("status", "in", "(completed,cancelled)")
    .order("number", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (order.error) throw order.error;
  if (!order.data) return;

  const inserted = await supabase.from("missing_items").insert({
    business_id: businessId,
    work_order_id: order.data.id,
    kind: "top",
    description: "אין טופ במלאי",
    responsible_staff_member_id: responsibleStaffMemberId,
  });
  if (inserted.error) throw inserted.error;
  console.log(`Created missing item on order ${order.data.id}.`);
}

function requireStaff(map: Map<string, string>, name: string): string {
  const id = map.get(name);
  if (!id) throw new Error(`Staff member "${name}" not found.`);
  return id;
}

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

type EnsureDemoOrderInput = {
  businessId: string;
  templateId: string;
  items: Awaited<ReturnType<typeof fetchResolvedIntakeItems>>;
  fallbackWorkStageId: string;
  workStageSortOrderById: Record<string, number>;
  customerName: string;
  phone: string;
  priority?: "normal" | "urgent";
  /** Sets `due_at` this many days out, so the dashboard's "due soon" KPI moves. */
  dueInDays?: number;
  responses: ItemResponse[];
  applyState: (
    tasksBySequence: { id: string; sequence_order: number }[],
  ) => Promise<void>;
};

async function ensureDemoOrder(supabase: AdminClient, input: EnsureDemoOrderInput) {
  const existingCustomer = await supabase
    .from("customers")
    .select("id")
    .eq("business_id", input.businessId)
    .eq("name", input.customerName)
    .maybeSingle();
  if (existingCustomer.error) throw existingCustomer.error;

  let customerId = existingCustomer.data?.id;
  if (!customerId) {
    const inserted = await supabase
      .from("customers")
      .insert({
        business_id: input.businessId,
        name: input.customerName,
        phone: input.phone,
      })
      .select("id")
      .single();
    if (inserted.error) throw inserted.error;
    customerId = inserted.data.id;
    console.log(`Created customer "${input.customerName}" (${customerId}).`);
  }

  const existingOrder = await supabase
    .from("work_orders")
    .select("id")
    .eq("customer_id", customerId)
    .maybeSingle();
  if (existingOrder.error) throw existingOrder.error;
  if (existingOrder.data) {
    console.log(
      `Order for "${input.customerName}" already exists -- skipping.`,
    );
    return;
  }

  const generated = generateWorkOrder({
    items: input.items,
    responses: input.responses,
    fallbackWorkStageId: input.fallbackWorkStageId,
    workStageSortOrderById: input.workStageSortOrderById,
  });

  const number = await supabase.rpc("next_work_order_number", {
    p_business_id: input.businessId,
  });
  if (number.error) throw number.error;

  const order = await supabase
    .from("work_orders")
    .insert({
      business_id: input.businessId,
      customer_id: customerId,
      intake_template_id: input.templateId,
      work_order_kind: "customer",
      number: number.data,
      intake_responses: generated.intakeResponses,
      priority: input.priority ?? "normal",
      due_at: input.dueInDays === undefined ? null : daysFromNow(input.dueInDays),
      notes: "[demo] נוצר על ידי seed:demo",
    })
    .select("id")
    .single();
  if (order.error) throw order.error;
  const orderId = order.data.id;

  if (generated.missingItems.length > 0) {
    const missing = await supabase.from("missing_items").insert(
      generated.missingItems.map((item) => ({
        business_id: input.businessId,
        work_order_id: orderId,
        kind: item.kind,
        description: item.description,
      })),
    );
    if (missing.error) throw missing.error;
  }

  const insertedTasks = await supabase
    .from("runtime_tasks")
    .insert(
      generated.tasks.map((task) => ({
        business_id: input.businessId,
        work_order_id: orderId,
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
    .select("id, sequence_order");
  if (insertedTasks.error) throw insertedTasks.error;

  const tasksBySequence = [...insertedTasks.data].sort(
    (a, b) => a.sequence_order - b.sequence_order,
  );
  await input.applyState(tasksBySequence);
  await recomputeOrderStatus(supabase, orderId);

  console.log(
    `Created order for "${input.customerName}" (${orderId}, ${insertedTasks.data.length} tasks).`,
  );
}

/**
 * Local mirror of `src/lib/work-orders/recompute.ts`'s DB adapter (same
 * pure `deriveOrderStatus`), minus the activity-log write -- that module's
 * *value* imports use the `@/` path alias, which only Next's build resolves,
 * not plain Node running this script.
 */
async function recomputeOrderStatus(supabase: AdminClient, workOrderId: string) {
  const order = await supabase
    .from("work_orders")
    .select("status")
    .eq("id", workOrderId)
    .single();
  if (order.error) throw order.error;
  if (["completed", "on_hold", "cancelled"].includes(order.data.status)) return;

  const tasks = await supabase
    .from("runtime_tasks")
    .select("status")
    .eq("work_order_id", workOrderId);
  if (tasks.error) throw tasks.error;

  const nextStatus = deriveOrderStatus(
    (tasks.data ?? []).map((t) => t.status as Parameters<typeof deriveOrderStatus>[0][number]),
  );
  if (nextStatus === order.data.status) return;

  const update = await supabase
    .from("work_orders")
    .update({ status: nextStatus })
    .eq("id", workOrderId);
  if (update.error) throw update.error;
}

async function updateTask(
  supabase: AdminClient,
  taskId: string,
  patch: Partial<{
    status: string;
    assigned_staff_member_id: string;
    started_at: string;
    completed_at: string;
    sprint_id: string | null;
    queue_rank: number;
    priority: boolean;
  }>,
) {
  const { error } = await supabase
    .from("runtime_tasks")
    .update(patch)
    .eq("id", taskId);
  if (error) throw error;
}

async function findUserIdByEmail(
  supabase: AdminClient,
  email: string,
): Promise<string | undefined> {
  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw error;
    const match = data.users.find((u) => u.email === email);
    if (match) return match.id;
    if (data.users.length < 200) return undefined;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
