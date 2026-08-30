/**
 * Idempotent **screen-coverage** seed: fills the gaps `seed:demo` leaves, so
 * every v1 screen, filter option, empty state, and pagination control has
 * something to render.
 *
 * `seed:demo` tells one small curated story (4 orders, 2 order statuses, 4
 * task statuses). That is enough to see the app working, but it leaves most
 * of the UI unreachable: 5 of the 7 order-status filters, the board's
 * "deferred" and "returned for rework" tabs, 3 of the 4 missing-item
 * statuses, 2 of the 3 missing-item kinds, every attachment and comment
 * section in the hub, and all three list paginations (page size is 20) show
 * nothing at all. This script covers those.
 *
 * Run with: npm run seed:screens (requires `seed:dev` and `seed:demo` first).
 *
 * Everything it creates is tagged `[qa]` in `notes`, and every customer name
 * is prefixed with QA_PREFIX, so its rows are obvious in the UI and this
 * script can find them again. Safe to run repeatedly.
 *
 * Uses the service-role admin client (bypasses RLS), like the other seeds.
 * Value imports are relative with a `.ts` extension: plain Node cannot
 * resolve the `@/` alias (see AGENTS.md).
 */
import { createAdminClient } from "../src/lib/supabase/admin.ts";
import { generateWorkOrder } from "../src/lib/work-orders/generate.ts";
import {
  fetchActiveWorkStages,
  fetchResolvedIntakeItems,
} from "../src/lib/work-orders/queries.ts";
import { rankAfter } from "../src/lib/queue/rank.ts";
import type { ItemResponse } from "../src/lib/work-orders/types.ts";

const BUSINESS_SLUG = "wiggy-dev";
const TEMPLATE_NAME = "פאה חדשה";
const QA_PREFIX = "בדיקה";
const QA_NOTE = "[qa] נוצר על ידי seed:screens";
/** The staff member `worker@wiggy.local` is linked to, per seed:demo. */
const WORKER_STAFF_NAME = "דנה כהן";

/** Page size for customers/orders/missing items is 20, so 20+ forces page 2. */
const BULK_CUSTOMER_COUNT = 24;

type AdminClient = ReturnType<typeof createAdminClient>;
type Items = Awaited<ReturnType<typeof fetchResolvedIntakeItems>>;

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

function dateOnly(daysFromToday: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  // Local getters, not toISOString -- a UTC slice shifts the date backwards
  // for anyone east of Greenwich late in the evening.
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * `--reset` deletes only what this script created -- rows tagged with
 * QA_NOTE and customers named with QA_PREFIX -- then reseeds. Scoped
 * deliberately: it must never touch `seed:dev`'s catalog or `seed:demo`'s
 * curated orders, so it keys off this script's own markers rather than
 * truncating tables.
 */
async function resetQaData(supabase: AdminClient, businessId: string) {
  const qaOrders = await supabase
    .from("work_orders")
    .select("id")
    .eq("business_id", businessId)
    .eq("notes", QA_NOTE);
  if (qaOrders.error) throw qaOrders.error;
  const orderIds = (qaOrders.data ?? []).map((o) => o.id);

  if (orderIds.length > 0) {
    // `attachments` is polymorphic -- `parent_id` carries no foreign key
    // (see 20260817150000_hub_schema.sql), so it does NOT cascade with the
    // order, and nothing anywhere deletes the Storage object. Both have to
    // be cleaned explicitly or every reset leaks a row and a file.
    const orphanedFiles = await supabase
      .from("attachments")
      .select("id, storage_path")
      .eq("business_id", businessId)
      .in("parent_id", orderIds);
    if (orphanedFiles.error) throw orphanedFiles.error;

    const paths = (orphanedFiles.data ?? []).map((a) => a.storage_path);
    if (paths.length > 0) {
      const removed = await supabase.storage.from("attachments").remove(paths);
      if (removed.error) throw removed.error;

      const deletedRows = await supabase
        .from("attachments")
        .delete()
        .in(
          "id",
          (orphanedFiles.data ?? []).map((a) => a.id),
        );
      if (deletedRows.error) throw deletedRows.error;
    }

    // runtime_tasks, missing_items and activity do cascade from work_orders;
    // task_comments cascade from runtime_tasks.
    const deleted = await supabase
      .from("work_orders")
      .delete()
      .in("id", orderIds);
    if (deleted.error) throw deleted.error;
  }

  const qaCustomers = await supabase
    .from("customers")
    .delete()
    .eq("business_id", businessId)
    .eq("notes", QA_NOTE)
    .select("id");
  if (qaCustomers.error) throw qaCustomers.error;

  const qaMissing = await supabase
    .from("missing_items")
    .delete()
    .eq("business_id", businessId)
    .eq("notes", QA_NOTE)
    .select("id");
  if (qaMissing.error) throw qaMissing.error;

  const closedSprint = await supabase
    .from("sprints")
    .delete()
    .eq("business_id", businessId)
    .eq("status", "closed")
    .select("id");
  if (closedSprint.error) throw closedSprint.error;

  const sweptOrphans = await sweepOrphanedAttachments(supabase, businessId);

  console.log(
    `Reset: removed ${orderIds.length} QA orders, ${qaCustomers.data?.length ?? 0} customers, ${qaMissing.data?.length ?? 0} stray missing items, ${closedSprint.data?.length ?? 0} closed sprints, ${sweptOrphans} orphaned attachments.\n`,
  );
}

/**
 * Deletes `work_order`-parented attachment rows whose order no longer exists,
 * and their Storage objects.
 *
 * These accumulate because `attachments.parent_id` has no foreign key, so
 * nothing in the database or the app removes an attachment when its parent
 * goes away. Anything that deletes a work order -- this script's own reset,
 * `createWorkOrderAction`'s compensating delete -- leaves them behind.
 */
async function sweepOrphanedAttachments(
  supabase: AdminClient,
  businessId: string,
): Promise<number> {
  const attachments = await supabase
    .from("attachments")
    .select("id, parent_id, storage_path")
    .eq("business_id", businessId)
    .eq("parent_type", "work_order");
  if (attachments.error) throw attachments.error;
  if (!attachments.data || attachments.data.length === 0) return 0;

  const orders = await supabase
    .from("work_orders")
    .select("id")
    .eq("business_id", businessId);
  if (orders.error) throw orders.error;
  const liveOrderIds = new Set((orders.data ?? []).map((o) => o.id));

  const orphans = attachments.data.filter(
    (a) => !liveOrderIds.has(a.parent_id),
  );
  if (orphans.length === 0) return 0;

  const removed = await supabase.storage
    .from("attachments")
    .remove(orphans.map((a) => a.storage_path));
  if (removed.error) throw removed.error;

  const deleted = await supabase
    .from("attachments")
    .delete()
    .in(
      "id",
      orphans.map((a) => a.id),
    );
  if (deleted.error) throw deleted.error;

  return orphans.length;
}

async function main() {
  const supabase = createAdminClient();
  const shouldReset = process.argv.includes("--reset");

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

  if (shouldReset) await resetQaData(supabase, businessId);

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
  const staff = staffResult.data ?? [];
  if (staff.length === 0) throw new Error("No staff members -- run seed:dev.");

  const items = await fetchResolvedIntakeItems(supabase, templateId);
  const handTyingItem = items.find(
    (i) => i.itemKind === "task_type" && i.taskType?.name === "קשירה ידנית",
  );
  const washGroupItem = items.find(
    (i) =>
      i.itemKind === "task_group" &&
      i.taskGroupTaskTypes?.some((t) => t.name === "שטיפה"),
  );
  const noSkinItem = items.find((i) => i.fieldKey === "no_skin");
  if (!handTyingItem || !washGroupItem) {
    throw new Error(
      "Expected intake items not found -- has the catalog changed?",
    );
  }
  const washId = washGroupItem.taskGroupTaskTypes!.find(
    (t) => t.name === "שטיפה",
  )!.id;
  const stylingId = washGroupItem.taskGroupTaskTypes!.find(
    (t) => t.name === "עיצוב",
  )!.id;

  const ctx: Ctx = {
    supabase,
    businessId,
    templateId,
    items,
    fallbackWorkStageId,
    workStageSortOrderById,
  };

  const fullIntake: ItemResponse[] = [
    { itemId: handTyingItem.id, taskTypeSelected: true },
    { itemId: washGroupItem.id, selectedGroupTaskTypeIds: [washId, stylingId] },
  ];

  // --- 1. Every order status the list can filter by -------------------------
  // `draft` precedes generation, so it deliberately has no tasks (§7.2).
  await ensureOrder(ctx, {
    customerName: `${QA_PREFIX} טיוטה`,
    phone: "050-9000001",
    responses: [],
    orderStatus: "draft",
  });

  await ensureOrder(ctx, {
    customerName: `${QA_PREFIX} מאושרת`,
    phone: "050-9000002",
    responses: fullIntake,
    // All tasks left `pending` -> derives to `confirmed`.
  });

  await ensureOrder(ctx, {
    customerName: `${QA_PREFIX} בהמתנה`,
    phone: "050-9000003",
    responses: fullIntake,
    orderStatus: "on_hold",
  });

  await ensureOrder(ctx, {
    customerName: `${QA_PREFIX} הושלמה`,
    phone: "050-9000004",
    responses: fullIntake,
    orderStatus: "completed",
    applyState: async (tasks) => {
      for (const task of tasks) {
        await updateTask(ctx, task.id, {
          status: "done",
          assigned_staff_member_id: staff[0]!.id,
          started_at: hoursAgo(70),
          completed_at: hoursAgo(60),
        });
      }
    },
  });

  await ensureOrder(ctx, {
    customerName: `${QA_PREFIX} מבוטלת`,
    phone: "050-9000005",
    responses: fullIntake,
    orderStatus: "cancelled",
  });

  // --- 2. Every task status the board can filter by -------------------------
  // The board's "deferred" and "returned for rework" tabs are empty without
  // these, and `skipped`/`cancelled` exercise the availability overlay
  // (§7.3: a terminal task must not block the one after it).
  await ensureOrder(ctx, {
    customerName: `${QA_PREFIX} סטטוסי משימות`,
    phone: "050-9000006",
    priority: "urgent",
    dueInDays: 2,
    responses: fullIntake,
    applyState: async (tasks) => {
      await updateTask(ctx, tasks[0]!.id, {
        status: "deferred",
        assigned_staff_member_id: staff[0]!.id,
        deferred_reason: "ממתין לחומר גלם מהספק",
        deferred_until: dateOnly(4),
      });
      await updateTask(ctx, tasks[1]!.id, {
        status: "returned_for_rework",
        assigned_staff_member_id: staff[1]!.id,
        started_at: hoursAgo(20),
      });
      if (tasks[2]) {
        await updateTask(ctx, tasks[2].id, {
          status: "skipped",
          assigned_staff_member_id: staff[2 % staff.length]!.id,
        });
      }
    },
  });

  await ensureOrder(ctx, {
    customerName: `${QA_PREFIX} משימות מבוטלות`,
    phone: "050-9000007",
    responses: fullIntake,
    applyState: async (tasks) => {
      await updateTask(ctx, tasks[0]!.id, { status: "cancelled" });
      // The next task must still be available -- a cancelled predecessor is
      // terminal, so this is the case that proves availability isn't just
      // "is the previous one done".
      await updateTask(ctx, tasks[1]!.id, {
        status: "pending",
        assigned_staff_member_id: staff[1]!.id,
      });
    },
  });

  // --- 3. Manual and "Other" task sources -----------------------------------
  const manualOrder = await ensureOrder(ctx, {
    customerName: `${QA_PREFIX} משימות ידניות`,
    phone: "050-9000008",
    responses: fullIntake,
  });
  if (manualOrder.created) {
    await addExtraTask(ctx, manualOrder.orderId, {
      title: "תיקון תפר חוזר (ידני)",
      source: "manual",
      workStageId: fallbackWorkStageId,
      sequenceOrder: 90,
      assignedStaffMemberId: staff[0]!.id,
    });
    await addExtraTask(ctx, manualOrder.orderId, {
      title: 'גזירת פוני לפי בקשת הלקוחה ("אחר")',
      source: "other",
      workStageId: fallbackWorkStageId,
      sequenceOrder: 91,
      requiresApproval: true,
    });
  }

  // --- 4. Hub content: attachments, comments, history ------------------------
  await seedHubContent(ctx, manualOrder.orderId, staff[0]!.id);

  // --- 5. Missing items: every status x every kind ---------------------------
  await seedMissingItems(ctx, manualOrder.orderId, staff);

  // --- 6. A closed sprint with carried-over work ----------------------------
  await seedClosedSprint(ctx);

  // --- 6b. A full personal queue for the worker login ------------------------
  await seedWorkerQueue(ctx, staff, fullIntake, handTyingItem.id);

  // --- 7. Edge cases the layout can break on --------------------------------
  await ensureBareCustomer(ctx);
  await ensureLongTextCustomer(ctx, noSkinItem?.id ?? null, staff[1]!.id);

  // --- 8. Volume, so all three list paginations appear ----------------------
  await seedBulkCustomers(ctx, staff);

  console.log("\nScreen-coverage seed complete.");
}

type Ctx = {
  supabase: AdminClient;
  businessId: string;
  templateId: string;
  items: Items;
  fallbackWorkStageId: string;
  workStageSortOrderById: Record<string, number>;
};

type EnsureOrderInput = {
  customerName: string;
  phone: string | null;
  email?: string | null;
  priority?: "normal" | "urgent";
  dueInDays?: number;
  responses: ItemResponse[];
  /** Forced after task setup, for the statuses recompute never produces. */
  orderStatus?: "draft" | "on_hold" | "completed" | "cancelled";
  applyState?: (
    tasksBySequence: { id: string; sequence_order: number }[],
  ) => Promise<void>;
};

async function ensureCustomer(
  ctx: Ctx,
  name: string,
  phone: string | null,
  email: string | null = null,
): Promise<string> {
  const existing = await ctx.supabase
    .from("customers")
    .select("id")
    .eq("business_id", ctx.businessId)
    .eq("name", name)
    .maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) return existing.data.id;

  const inserted = await ctx.supabase
    .from("customers")
    .insert({
      business_id: ctx.businessId,
      name,
      phone,
      email,
      notes: QA_NOTE,
    })
    .select("id")
    .single();
  if (inserted.error) throw inserted.error;
  return inserted.data.id;
}

/** Creates the order via the real generator, then nudges it into shape. */
async function ensureOrder(
  ctx: Ctx,
  input: EnsureOrderInput,
): Promise<{ orderId: string; created: boolean }> {
  const customerId = await ensureCustomer(
    ctx,
    input.customerName,
    input.phone,
    input.email ?? null,
  );

  const existingOrder = await ctx.supabase
    .from("work_orders")
    .select("id")
    .eq("customer_id", customerId)
    .limit(1)
    .maybeSingle();
  if (existingOrder.error) throw existingOrder.error;
  if (existingOrder.data) {
    return { orderId: existingOrder.data.id, created: false };
  }

  const generated = generateWorkOrder({
    items: ctx.items,
    responses: input.responses,
    fallbackWorkStageId: ctx.fallbackWorkStageId,
    workStageSortOrderById: ctx.workStageSortOrderById,
  });

  const number = await ctx.supabase.rpc("next_work_order_number", {
    p_business_id: ctx.businessId,
  });
  if (number.error) throw number.error;

  const order = await ctx.supabase
    .from("work_orders")
    .insert({
      business_id: ctx.businessId,
      customer_id: customerId,
      intake_template_id: ctx.templateId,
      work_order_kind: "customer",
      number: number.data,
      status: input.orderStatus === "draft" ? "draft" : "confirmed",
      intake_responses: generated.intakeResponses,
      priority: input.priority ?? "normal",
      due_at:
        input.dueInDays === undefined ? null : daysFromNow(input.dueInDays),
      notes: QA_NOTE,
    })
    .select("id")
    .single();
  if (order.error) throw order.error;
  const orderId = order.data.id;

  if (generated.missingItems.length > 0) {
    const missing = await ctx.supabase.from("missing_items").insert(
      generated.missingItems.map((item) => ({
        business_id: ctx.businessId,
        work_order_id: orderId,
        kind: item.kind,
        description: item.description,
      })),
    );
    if (missing.error) throw missing.error;
  }

  let tasksBySequence: { id: string; sequence_order: number }[] = [];
  if (generated.tasks.length > 0) {
    const insertedTasks = await ctx.supabase
      .from("runtime_tasks")
      .insert(
        generated.tasks.map((task) => ({
          business_id: ctx.businessId,
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
    tasksBySequence = [...insertedTasks.data].sort(
      (a, b) => a.sequence_order - b.sequence_order,
    );
  }

  if (input.applyState) await input.applyState(tasksBySequence);

  // Forced last: recompute would otherwise overwrite it, and the sticky
  // statuses (§7.2) are manual-only outcomes it never produces.
  if (input.orderStatus && input.orderStatus !== "draft") {
    const forced = await ctx.supabase
      .from("work_orders")
      .update({ status: input.orderStatus })
      .eq("id", orderId);
    if (forced.error) throw forced.error;
  } else if (input.orderStatus !== "draft") {
    await recomputeOrderStatus(ctx, orderId);
  }

  console.log(
    `Created order for "${input.customerName}" (${tasksBySequence.length} tasks, status ${input.orderStatus ?? "derived"}).`,
  );
  return { orderId, created: true };
}

async function addExtraTask(
  ctx: Ctx,
  workOrderId: string,
  input: {
    title: string;
    source: "manual" | "other";
    workStageId: string;
    sequenceOrder: number;
    requiresApproval?: boolean;
    assignedStaffMemberId?: string;
  },
) {
  const inserted = await ctx.supabase.from("runtime_tasks").insert({
    business_id: ctx.businessId,
    work_order_id: workOrderId,
    title: input.title,
    work_stage_id: input.workStageId,
    sequence_order: input.sequenceOrder,
    source: input.source,
    requires_approval: input.requiresApproval ?? false,
    assigned_staff_member_id: input.assignedStaffMemberId ?? null,
  });
  if (inserted.error) throw inserted.error;
}

async function updateTask(
  ctx: Ctx,
  taskId: string,
  patch: Record<string, unknown>,
) {
  const updated = await ctx.supabase
    .from("runtime_tasks")
    // The patch shape is per-call and intentionally loose here; the columns
    // are checked by the DB, and this is a seed script, not app code.
    .update(patch as never)
    .eq("id", taskId);
  if (updated.error) throw updated.error;
}

async function recomputeOrderStatus(ctx: Ctx, workOrderId: string) {
  const tasks = await ctx.supabase
    .from("runtime_tasks")
    .select("status")
    .eq("work_order_id", workOrderId);
  if (tasks.error) throw tasks.error;

  const statuses = (tasks.data ?? []).map((t) => t.status);
  const counting = statuses.filter((s) => s !== "skipped" && s !== "cancelled");
  const next =
    statuses.length === 0
      ? "confirmed"
      : counting.every((s) => s === "done")
        ? "ready_for_handoff"
        : statuses.some((s) => s !== "pending")
          ? "active"
          : "confirmed";

  const updated = await ctx.supabase
    .from("work_orders")
    .update({ status: next })
    .eq("id", workOrderId);
  if (updated.error) throw updated.error;
}

/**
 * Files, photos, a voice note, and comments on the hub -- the sections that
 * are otherwise permanently empty. Real bytes go into Storage so the signed
 * URLs actually resolve and the `<audio>`/`<Image>` elements render.
 */
async function seedHubContent(ctx: Ctx, workOrderId: string, staffId: string) {
  void staffId;
  const existing = await ctx.supabase
    .from("attachments")
    .select("id")
    .eq("business_id", ctx.businessId)
    .eq("parent_id", workOrderId)
    .limit(1)
    .maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) {
    console.log("Hub attachments already seeded -- skipping.");
    return;
  }

  // Looked up in `profiles`, not via `auth.admin.listUsers()`: that call
  // paginates at 50, and the integration suite leaves enough `@wiggy.test`
  // users behind that the admin falls off page 1 -- which silently produced
  // null-authored comments rendered as the generic "user".
  const admin = await ctx.supabase
    .from("profiles")
    .select("id")
    .eq("email", "admin@wiggy.local")
    .maybeSingle();
  if (admin.error) throw admin.error;
  const adminUserId = admin.data?.id ?? null;
  if (!adminUserId) {
    throw new Error(
      "admin@wiggy.local profile not found -- run seed:dev first.",
    );
  }

  const files: {
    name: string;
    kind: "photo" | "file" | "voice";
    body: Uint8Array;
    mime: string;
  }[] = [
    {
      name: "reference-front.png",
      kind: "photo",
      body: pngBytes(),
      mime: "image/png",
    },
    {
      name: "reference-side.png",
      kind: "photo",
      body: pngBytes(),
      mime: "image/png",
    },
    {
      name: "measurements.txt",
      kind: "file",
      body: new TextEncoder().encode('היקף: 55 ס"מ\nאורך: 40 ס"מ\n'),
      mime: "text/plain",
    },
    {
      name: "voice-note-qa.wav",
      kind: "voice",
      body: wavBytes(),
      mime: "audio/wav",
    },
  ];

  for (const file of files) {
    const path = `${ctx.businessId}/work_order/${workOrderId}/${Date.now()}-${file.name}`;
    const upload = await ctx.supabase.storage
      .from("attachments")
      .upload(path, file.body, { contentType: file.mime, upsert: true });
    if (upload.error) throw upload.error;

    const row = await ctx.supabase.from("attachments").insert({
      business_id: ctx.businessId,
      kind: file.kind,
      parent_type: "work_order",
      parent_id: workOrderId,
      storage_path: path,
      file_name: file.name,
      mime_type: file.mime,
      uploaded_by: adminUserId,
    });
    if (row.error) throw row.error;
  }
  console.log(`Uploaded ${files.length} attachments to the hub.`);

  const tasks = await ctx.supabase
    .from("runtime_tasks")
    .select("id")
    .eq("work_order_id", workOrderId)
    .order("sequence_order")
    .limit(2);
  if (tasks.error) throw tasks.error;

  const commentTargets = tasks.data ?? [];
  for (let index = 0; index < commentTargets.length; index++) {
    const task = commentTargets[index]!;
    const comment = await ctx.supabase.from("task_comments").insert({
      business_id: ctx.businessId,
      runtime_task_id: task.id,
      author_user_id: adminUserId,
      body:
        index === 0
          ? "הלקוחה ביקשה גוון מעט בהיר יותר מהדוגמה."
          : "שים לב: החומר עדין, לעבוד בטמפרטורה נמוכה.",
    });
    if (comment.error) throw comment.error;
  }

  const activity = await ctx.supabase.from("activity").insert([
    {
      business_id: ctx.businessId,
      actor_user_id: adminUserId,
      verb: "order_created",
      subject_type: "work_order",
      subject_id: workOrderId,
      work_order_id: workOrderId,
      payload: { source: "qa-seed" },
    },
    {
      business_id: ctx.businessId,
      actor_user_id: adminUserId,
      verb: "order_intake_edited",
      subject_type: "work_order",
      subject_id: workOrderId,
      work_order_id: workOrderId,
      payload: {
        changes: [
          { label: "הערות", previousValue: "ללא", value: "גוון בהיר יותר" },
        ],
      },
    },
  ]);
  if (activity.error) throw activity.error;
  console.log("Seeded comments + history entries on the hub.");
}

/**
 * Every missing-item status x kind, so the list's filters all resolve,
 * spread round-robin across the QA orders. Piling all 24 onto one order
 * made that order's hub render an 18-row warnings section, which is not a
 * shape any real salon produces and buries the rest of the screen.
 */
async function seedMissingItems(
  ctx: Ctx,
  fallbackWorkOrderId: string,
  staff: { id: string; full_name: string }[],
) {
  const existing = await ctx.supabase
    .from("missing_items")
    .select("id")
    .eq("business_id", ctx.businessId)
    .eq("notes", QA_NOTE)
    .limit(1)
    .maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) {
    console.log("QA missing items already seeded -- skipping.");
    return;
  }

  const kinds = ["top", "skin", "material"] as const;
  const statuses = ["open", "found", "ordered", "handled"] as const;

  // Every kind x status pair twice over: covers all 12 filter combinations
  // and pushes the list past its 20-row page size so pagination renders.
  const combos: {
    kind: (typeof kinds)[number];
    status: (typeof statuses)[number];
  }[] = [];
  for (let round = 0; round < 2; round++) {
    for (const kind of kinds) {
      for (const status of statuses) combos.push({ kind, status });
    }
  }

  // Spread across the QA orders rather than stacking on one.
  const qaOrders = await ctx.supabase
    .from("work_orders")
    .select("id")
    .eq("business_id", ctx.businessId)
    .eq("notes", QA_NOTE)
    .not("status", "in", "(completed,cancelled)")
    .limit(12);
  if (qaOrders.error) throw qaOrders.error;
  const orderIds =
    qaOrders.data && qaOrders.data.length > 0
      ? qaOrders.data.map((o) => o.id)
      : [fallbackWorkOrderId];

  const rows = combos.map((combo, index) => ({
    business_id: ctx.businessId,
    work_order_id: orderIds[index % orderIds.length]!,
    kind: combo.kind,
    status: combo.status,
    description: `פריט חסר לבדיקה — ${combo.kind}/${combo.status}`,
    responsible_staff_member_id: staff[index % staff.length]!.id,
    // `handled_at` is stamped exactly while status is `handled` (§7.4).
    handled_at: combo.status === "handled" ? hoursAgo(12) : null,
    notes: QA_NOTE,
  }));

  const inserted = await ctx.supabase.from("missing_items").insert(rows);
  if (inserted.error) throw inserted.error;
  console.log(`Seeded ${rows.length} missing items across all statuses/kinds.`);
}

/**
 * A closed sprint still holding unfinished tasks -- the carryover case
 * (ADR 0008): they must keep showing in My Work rather than vanishing.
 */
async function seedClosedSprint(ctx: Ctx) {
  const existing = await ctx.supabase
    .from("sprints")
    .select("id")
    .eq("business_id", ctx.businessId)
    .eq("status", "closed")
    .limit(1)
    .maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) {
    console.log("Closed sprint already exists -- skipping.");
    return;
  }

  const inserted = await ctx.supabase
    .from("sprints")
    .insert({
      business_id: ctx.businessId,
      name: "ספרינט קודם (סגור)",
      starts_on: dateOnly(-14),
      ends_on: dateOnly(-7),
      status: "closed",
    })
    .select("id")
    .single();
  if (inserted.error) throw inserted.error;

  // Leave a couple of still-open tasks pointing at it.
  const orphans = await ctx.supabase
    .from("runtime_tasks")
    .select("id")
    .eq("business_id", ctx.businessId)
    .is("sprint_id", null)
    .in("status", ["pending", "returned_for_rework"])
    .limit(2);
  if (orphans.error) throw orphans.error;

  for (const task of orphans.data ?? []) {
    await updateTask(ctx, task.id, { sprint_id: inserted.data.id });
  }
  console.log(
    `Created a closed sprint carrying ${orphans.data?.length ?? 0} unfinished tasks.`,
  );
}

/**
 * Gives the worker login (`worker@wiggy.local` -> staff member "דנה כהן") a
 * queue that actually exercises every My Work section.
 *
 * The demo seed leaves her with only in-progress and finished tasks, so
 * "next", "queue" and "blocked" render nothing at all. Availability is
 * linear *per work order* (architecture §7.3) -- only the earliest
 * non-terminal task in an order is available -- so several available tasks
 * means several orders, not several tasks in one. Ranks are set explicitly
 * so "next" is deterministic rather than whatever the DB returns first.
 */
async function seedWorkerQueue(
  ctx: Ctx,
  staff: { id: string; full_name: string }[],
  fullIntake: ItemResponse[],
  handTyingItemId: string,
) {
  const worker = staff.find((s) => s.full_name === WORKER_STAFF_NAME);
  if (!worker) {
    console.log(
      `Staff member "${WORKER_STAFF_NAME}" not found -- skipping worker queue.`,
    );
    return;
  }
  const other = staff.find((s) => s.id !== worker.id) ?? worker;

  // Three single-task orders -> three *available* tasks -> next + queue.
  for (let index = 1; index <= 3; index++) {
    await ensureOrder(ctx, {
      customerName: `${QA_PREFIX} תור ${index}`,
      phone: `053-200000${index}`,
      priority: index === 1 ? "urgent" : "normal",
      dueInDays: index,
      responses: [{ itemId: handTyingItemId, taskTypeSelected: true }],
      applyState: async (tasks) => {
        if (!tasks[0]) return;
        await updateTask(ctx, tasks[0].id, {
          assigned_staff_member_id: worker.id,
          queue_rank: rankAfter(null) * index,
          priority: index === 1,
        });
      },
    });
  }

  // An order whose first task belongs to someone else and is still running,
  // so her task behind it is sequence-blocked ("future/blocked").
  await ensureOrder(ctx, {
    customerName: `${QA_PREFIX} תור חסום`,
    phone: "053-2000004",
    responses: fullIntake,
    applyState: async (tasks) => {
      if (!tasks[0] || !tasks[1]) return;
      await updateTask(ctx, tasks[0].id, {
        status: "in_progress",
        assigned_staff_member_id: other.id,
        started_at: hoursAgo(2),
      });
      await updateTask(ctx, tasks[1].id, {
        assigned_staff_member_id: worker.id,
        queue_rank: rankAfter(null) * 4,
      });
    },
  });

  // A deferred task of her own -> the other kind of "blocked" row.
  await ensureOrder(ctx, {
    customerName: `${QA_PREFIX} תור נדחה`,
    phone: "053-2000005",
    responses: [{ itemId: handTyingItemId, taskTypeSelected: true }],
    applyState: async (tasks) => {
      if (!tasks[0]) return;
      await updateTask(ctx, tasks[0].id, {
        status: "deferred",
        assigned_staff_member_id: worker.id,
        queue_rank: rankAfter(null) * 5,
        deferred_reason: "הלקוחה ביקשה להקפיא עד לאחר החג",
        deferred_until: dateOnly(6),
      });
    },
  });

  console.log(`Seeded a full personal queue for "${WORKER_STAFF_NAME}".`);
}

/** A customer with no phone, no email, and no orders: the empty-history state. */
async function ensureBareCustomer(ctx: Ctx) {
  await ensureCustomer(ctx, `${QA_PREFIX} לקוחה ללא הזמנות`, null, null);
  console.log("Ensured a customer with no contact details and no orders.");
}

/**
 * Long Hebrew strings, to catch RTL truncation and wrapping bugs. Needs real
 * tasks: the board card and the queue row are where a long customer name
 * actually has to truncate, so an order with no tasks would never reach them.
 */
async function ensureLongTextCustomer(
  ctx: Ctx,
  noSkinItemId: string | null,
  staffId: string,
) {
  const longName = `${QA_PREFIX} שם ארוך במיוחד לבדיקת גלישת טקסט וקטיעה בממשק בעברית`;
  const handTying = ctx.items.find(
    (i) => i.itemKind === "task_type" && i.taskType?.name === "קשירה ידנית",
  )!;
  const responses: ItemResponse[] = [
    { itemId: handTying.id, taskTypeSelected: true },
    ...(noSkinItemId
      ? [{ itemId: noSkinItemId, fieldValue: "כן" } as ItemResponse]
      : []),
  ];

  await ensureOrder(ctx, {
    customerName: longName,
    phone: "050-9000099",
    email: "a-very-long-email-address-for-layout-testing@example.com",
    priority: "urgent",
    dueInDays: 1,
    responses,
    applyState: async (tasks) => {
      if (tasks[0]) {
        await updateTask(ctx, tasks[0].id, {
          status: "in_progress",
          assigned_staff_member_id: staffId,
          started_at: hoursAgo(3),
        });
      }
    },
  });
}

/**
 * Bulk customers, each with one order, purely so the customers list, the
 * orders list, and their pagination controls go past page 1 (page size 20).
 */
async function seedBulkCustomers(
  ctx: Ctx,
  staff: { id: string; full_name: string }[],
) {
  // Checks for the first *numbered* customer specifically. A `like` on
  // "<prefix> לקוחה %" also matches the no-orders edge-case customer created
  // just above, which made this skip everything on a clean database.
  const existing = await ctx.supabase
    .from("customers")
    .select("id")
    .eq("business_id", ctx.businessId)
    .eq("name", `${QA_PREFIX} לקוחה 01`)
    .maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) {
    console.log("Bulk QA customers already seeded -- skipping.");
    return;
  }

  const handTying = ctx.items.find(
    (i) => i.itemKind === "task_type" && i.taskType?.name === "קשירה ידנית",
  )!;

  for (let index = 1; index <= BULK_CUSTOMER_COUNT; index++) {
    const label = String(index).padStart(2, "0");
    const result = await ensureOrder(ctx, {
      customerName: `${QA_PREFIX} לקוחה ${label}`,
      phone: `052-10000${label}`,
      email: index % 3 === 0 ? `qa${label}@example.com` : null,
      priority: index % 5 === 0 ? "urgent" : "normal",
      dueInDays: index % 4 === 0 ? index % 10 : undefined,
      responses: [{ itemId: handTying.id, taskTypeSelected: true }],
      applyState: async (tasks) => {
        if (!tasks[0]) return;
        // A spread of states so the board columns and the queue aren't all
        // one shape at volume.
        if (index % 4 === 0) {
          await updateTask(ctx, tasks[0].id, {
            status: "done",
            assigned_staff_member_id: staff[index % staff.length]!.id,
            started_at: hoursAgo(index + 10),
            completed_at: hoursAgo(index),
          });
        } else if (index % 3 === 0) {
          await updateTask(ctx, tasks[0].id, {
            status: "in_progress",
            assigned_staff_member_id: staff[index % staff.length]!.id,
            started_at: hoursAgo(index),
            queue_rank: rankAfter(null) + index,
          });
        } else if (index % 5 === 0) {
          await updateTask(ctx, tasks[0].id, {
            status: "awaiting_approval",
            assigned_staff_member_id: staff[index % staff.length]!.id,
            started_at: hoursAgo(index + 2),
          });
        }
      },
    });
    void result;
  }
  console.log(`Seeded ${BULK_CUSTOMER_COUNT} bulk customers with orders.`);
}

/** A tiny but valid 2x2 PNG, so <Image> renders a real thumbnail. */
function pngBytes(): Uint8Array {
  const base64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR4nGP8z8Dwn4GBgYGJAQoAHxUCB0iNXhcAAAAASUVORK5CYII=";
  return Uint8Array.from(Buffer.from(base64, "base64"));
}

/** A valid 0.4s 440Hz mono WAV, so the <audio> player has real audio. */
function wavBytes(): Uint8Array {
  const rate = 8000;
  const samples = Math.floor(rate * 0.4);
  const buffer = new ArrayBuffer(44 + samples * 2);
  const view = new DataView(buffer);
  const ascii = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++)
      view.setUint8(offset + i, text.charCodeAt(i));
  };

  ascii(0, "RIFF");
  view.setUint32(4, 36 + samples * 2, true);
  ascii(8, "WAVEfmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  ascii(36, "data");
  view.setUint32(40, samples * 2, true);
  for (let i = 0; i < samples; i++) {
    view.setInt16(
      44 + i * 2,
      Math.sin((i / rate) * 440 * 2 * Math.PI) * 16000,
      true,
    );
  }
  return new Uint8Array(buffer);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
