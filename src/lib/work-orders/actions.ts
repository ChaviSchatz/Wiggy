"use server";

import { getCurrentUser } from "@/lib/auth/server";
import { listCustomers } from "@/lib/customers/queries";
import { can } from "@/lib/roles";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { generateWorkOrder } from "./generate";
import { fetchActiveWorkStages, fetchResolvedIntakeItems } from "./queries";
import type { ItemResponse } from "./types";

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
