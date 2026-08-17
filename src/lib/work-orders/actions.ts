"use server";

import { revalidatePath } from "next/cache";

import { logActivity } from "@/lib/activity/log";
import { getCurrentUser } from "@/lib/auth/server";
import { listCustomers } from "@/lib/customers/queries";
import { can } from "@/lib/roles";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { recomputeOrderStatus } from "./recompute";
import { generateWorkOrder } from "./generate";
import { fetchActiveWorkStages, fetchResolvedIntakeItems } from "./queries";
import type { IntakeResponseEntry, ItemResponse } from "./types";

export type CreateWorkOrderInput = {
  customerId: string | null;
  intakeTemplateId: string;
  responses: ItemResponse[];
  dueAt: string | null;
  priority: "normal" | "urgent";
  orderReceivedDate: string;
  notes: string;
};

export type CreateWorkOrderResult =
  | { success: true; workOrderId: string; number: number }
  | { success: false; error: string };

/**
 * Confirms an intake: generates and persists the work order + its runtime
 * tasks (architecture §6). Not wrapped in a Postgres transaction (see
 * `next_work_order_number` for why that path exists for the counter, but
 * doesn't for this): the two inserts below are (a) a single-row insert and
 * (b) a single bulk insert (one INSERT statement covers every task row, so
 * it's atomic by itself). The only residual risk is a crash between the two
 * -- handled with a best-effort compensating delete, not a hard guarantee.
 */
export async function createWorkOrderAction(
  input: CreateWorkOrderInput,
): Promise<CreateWorkOrderResult> {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "createOrders")) {
    return { success: false, error: "forbidden" };
  }

  const supabase = await createServerSupabaseClient();

  const { data: template, error: templateError } = await supabase
    .from("intake_templates")
    .select("id, work_order_kind, is_active")
    .eq("id", input.intakeTemplateId)
    .maybeSingle();
  if (templateError || !template || !template.is_active) {
    return { success: false, error: "invalidTemplate" };
  }

  const [items, workStages] = await Promise.all([
    fetchResolvedIntakeItems(supabase, input.intakeTemplateId),
    fetchActiveWorkStages(supabase, user.businessId),
  ]);

  if (workStages.length === 0) {
    return { success: false, error: "noWorkStages" };
  }

  const workStageSortOrderById = Object.fromEntries(
    workStages.map((stage) => [stage.id, stage.sort_order]),
  );
  const fallbackWorkStageId = workStages[0].id;

  const generated = generateWorkOrder({
    items,
    responses: input.responses,
    fallbackWorkStageId,
    workStageSortOrderById,
  });

  const { data: number, error: numberError } = await supabase.rpc(
    "next_work_order_number",
    { p_business_id: user.businessId },
  );
  if (numberError || number == null) {
    return { success: false, error: "generic" };
  }

  const { data: order, error: orderError } = await supabase
    .from("work_orders")
    .insert({
      business_id: user.businessId,
      customer_id: input.customerId,
      intake_template_id: input.intakeTemplateId,
      work_order_kind: template.work_order_kind,
      number,
      status: "confirmed",
      priority: input.priority,
      due_at: input.dueAt,
      order_received_date: input.orderReceivedDate,
      intake_responses: generated.intakeResponses,
      notes: input.notes.trim() || null,
      created_by: user.id,
    })
    .select("id, number")
    .single();
  if (orderError || !order) {
    return { success: false, error: "generic" };
  }

  if (generated.tasks.length > 0) {
    const { error: tasksError } = await supabase.from("runtime_tasks").insert(
      generated.tasks.map((task) => ({
        business_id: user.businessId,
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

    if (tasksError) {
      // Compensating cleanup: don't leave a "confirmed" order with none of
      // its generated tasks. Best-effort -- see the function doc comment.
      await supabase.from("work_orders").delete().eq("id", order.id);
      return { success: false, error: "generic" };
    }
  }

  await logActivity(supabase, {
    businessId: user.businessId,
    actorUserId: user.id,
    verb: "order_created",
    subjectType: "work_order",
    subjectId: order.id,
    workOrderId: order.id,
    customerId: input.customerId,
    payload: { taskCount: generated.tasks.length },
  });

  return { success: true, workOrderId: order.id, number: order.number };
}

export type SearchCustomersResult = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
}[];

/** Live customer search for New Order wizard Step 1. */
export async function searchCustomersAction(
  search: string,
): Promise<SearchCustomersResult> {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createServerSupabaseClient();
  const { customers } = await listCustomers(supabase, {
    businessId: user.businessId,
    search,
    page: 1,
  });

  return customers.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    email: c.email,
  }));
}

async function requireOrderManager() {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "createOrders")) return null;
  return user;
}

export type HubActionResult =
  { success: true } | { success: false; error: string };

/**
 * Edit intake data after creation (screen inventory #24), audited via
 * `activity`. Only the free-text `field`/"Other" entries that generation
 * actually snapshots into `intake_responses` are editable here (§6) --
 * task-type/group *selections* already became runtime tasks and aren't
 * represented in this JSON array at all.
 */
export async function editIntakeAction(
  workOrderId: string,
  entries: IntakeResponseEntry[],
): Promise<HubActionResult> {
  const user = await requireOrderManager();
  if (!user) return { success: false, error: "forbidden" };

  const supabase = await createServerSupabaseClient();
  const { data: existingOrder, error: fetchError } = await supabase
    .from("work_orders")
    .select("intake_responses")
    .eq("id", workOrderId)
    .maybeSingle();
  if (fetchError || !existingOrder) return { success: false, error: "notFound" };

  const previous = (existingOrder.intake_responses ??
    []) as IntakeResponseEntry[];
  const previousByItemId = new Map(previous.map((e) => [e.itemId, e.value]));
  const changes = entries
    .filter((entry) => previousByItemId.get(entry.itemId) !== entry.value)
    .map((entry) => ({
      label: entry.label,
      previousValue: previousByItemId.get(entry.itemId) ?? null,
      value: entry.value,
    }));

  const { error } = await supabase
    .from("work_orders")
    .update({ intake_responses: entries })
    .eq("id", workOrderId);
  if (error) return { success: false, error: "generic" };

  if (changes.length > 0) {
    await logActivity(supabase, {
      businessId: user.businessId,
      actorUserId: user.id,
      verb: "order_intake_edited",
      subjectType: "work_order",
      subjectId: workOrderId,
      workOrderId,
      payload: { changes },
    });
  }

  revalidatePath(`/orders/${workOrderId}`);
  return { success: true };
}

/** Cancel order (screen inventory #22) -- manual, sticky (§7.2). */
export async function cancelOrderAction(
  workOrderId: string,
): Promise<HubActionResult> {
  const user = await requireOrderManager();
  if (!user) return { success: false, error: "forbidden" };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("work_orders")
    .update({ status: "cancelled" })
    .eq("id", workOrderId)
    .not("status", "in", "(completed,cancelled)");
  if (error) return { success: false, error: "generic" };

  await logActivity(supabase, {
    businessId: user.businessId,
    actorUserId: user.id,
    verb: "order_cancelled",
    subjectType: "work_order",
    subjectId: workOrderId,
    workOrderId,
  });

  revalidatePath(`/orders/${workOrderId}`);
  revalidatePath("/orders");
  return { success: true };
}

/**
 * Mark delivered/collected -> completed (screen inventory #23, §7.2:
 * "ready_for_handoff -> completed ... an order outcome, never a task
 * state"). Only valid from `ready_for_handoff`, matching that transition.
 */
export async function markDeliveredAction(
  workOrderId: string,
): Promise<HubActionResult> {
  const user = await requireOrderManager();
  if (!user) return { success: false, error: "forbidden" };

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("work_orders")
    .update({ status: "completed" })
    .eq("id", workOrderId)
    .eq("status", "ready_for_handoff")
    .select("id");
  if (error) return { success: false, error: "generic" };
  if (!data || data.length === 0) {
    return { success: false, error: "invalidTransition" };
  }

  await logActivity(supabase, {
    businessId: user.businessId,
    actorUserId: user.id,
    verb: "order_delivered",
    subjectType: "work_order",
    subjectId: workOrderId,
    workOrderId,
  });

  revalidatePath(`/orders/${workOrderId}`);
  revalidatePath("/orders");
  return { success: true };
}

export type AddManualTaskInput = {
  workOrderId: string;
  taskTypeId: string | null;
  /** Required when `taskTypeId` is null (ADR 0006-style free-text "Other" task). */
  otherTitle?: string;
  workStageId: string;
};

/** Add manual / "Other" task (screen inventory #25). */
export async function addManualTaskAction(
  input: AddManualTaskInput,
): Promise<HubActionResult> {
  const user = await requireOrderManager();
  if (!user) return { success: false, error: "forbidden" };

  const supabase = await createServerSupabaseClient();

  let title: string;
  let description: string | null = null;
  let requiresApproval = false;
  let workStageId = input.workStageId;
  let source: "manual" | "other" = "manual";

  if (input.taskTypeId) {
    const { data: taskType, error: taskTypeError } = await supabase
      .from("task_types")
      .select("name, description, default_work_stage_id, requires_approval_default")
      .eq("id", input.taskTypeId)
      .maybeSingle();
    if (taskTypeError || !taskType) return { success: false, error: "notFound" };
    title = taskType.name;
    description = taskType.description;
    requiresApproval = taskType.requires_approval_default;
    workStageId = taskType.default_work_stage_id;
  } else {
    const trimmed = input.otherTitle?.trim();
    if (!trimmed) return { success: false, error: "titleRequired" };
    if (!workStageId) return { success: false, error: "workStageRequired" };
    title = trimmed;
    source = "other";
  }

  const { data: maxSequenceRow } = await supabase
    .from("runtime_tasks")
    .select("sequence_order")
    .eq("work_order_id", input.workOrderId)
    .order("sequence_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const sequenceOrder = (maxSequenceRow?.sequence_order ?? -1) + 1;

  const { data: task, error } = await supabase
    .from("runtime_tasks")
    .insert({
      business_id: user.businessId,
      work_order_id: input.workOrderId,
      task_type_id: input.taskTypeId,
      title,
      description,
      work_stage_id: workStageId,
      sequence_order: sequenceOrder,
      requires_approval: requiresApproval,
      source,
    })
    .select("id")
    .single();
  if (error || !task) return { success: false, error: "generic" };

  await logActivity(supabase, {
    businessId: user.businessId,
    actorUserId: user.id,
    verb: "task_created",
    subjectType: "runtime_task",
    subjectId: task.id,
    workOrderId: input.workOrderId,
    payload: { title, source },
  });
  await recomputeOrderStatus(supabase, input.workOrderId, user.businessId, user.id);

  revalidatePath(`/orders/${input.workOrderId}`);
  revalidatePath("/board");
  return { success: true };
}
