import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Tables } from "@/lib/supabase/database.types";
import type { IntakeItemConfig, ResolvedIntakeItem, TaskType } from "./types";

export const WORK_ORDERS_PAGE_SIZE = 20;

/** Active intake templates for Step 2 of the New Order wizard. */
export async function fetchActiveIntakeTemplates(
  supabase: SupabaseClient<Database>,
  businessId: string,
) {
  const { data, error } = await supabase
    .from("intake_templates")
    .select("*")
    .eq("business_id", businessId)
    .eq("is_active", true)
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/** Active work stages, ordered -- used for sequencing and the "Other" fallback stage. */
export async function fetchActiveWorkStages(
  supabase: SupabaseClient<Database>,
  businessId: string,
) {
  const { data, error } = await supabase
    .from("work_stages")
    .select("*")
    .eq("business_id", businessId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/**
 * Loads one intake template's items (Step 3 render + generation input),
 * resolving task_type/task_group references to full catalog rows so the
 * generator never has to query the DB itself. Avoids Supabase's embedded-
 * relation typing entirely (matches the approach in
 * src/lib/auth/current-user.ts) -- a few explicit queries instead.
 */
export async function fetchResolvedIntakeItems(
  supabase: SupabaseClient<Database>,
  intakeTemplateId: string,
): Promise<ResolvedIntakeItem[]> {
  const { data: itemRows, error: itemsError } = await supabase
    .from("intake_template_items")
    .select("*")
    .eq("intake_template_id", intakeTemplateId)
    .order("sort_order", { ascending: true });
  if (itemsError) throw itemsError;

  const taskGroupIds = Array.from(
    new Set(
      (itemRows ?? [])
        .filter((row) => row.item_kind === "task_group" && row.task_group_id)
        .map((row) => row.task_group_id as string),
    ),
  );

  const taskTypeIdsByGroupId = new Map<string, string[]>();
  if (taskGroupIds.length > 0) {
    const { data: groupItems, error: groupItemsError } = await supabase
      .from("task_group_items")
      .select("task_group_id, task_type_id, sort_order")
      .in("task_group_id", taskGroupIds)
      .order("sort_order", { ascending: true });
    if (groupItemsError) throw groupItemsError;

    for (const groupItem of groupItems ?? []) {
      const list = taskTypeIdsByGroupId.get(groupItem.task_group_id) ?? [];
      list.push(groupItem.task_type_id);
      taskTypeIdsByGroupId.set(groupItem.task_group_id, list);
    }
  }

  const directTaskTypeIds = (itemRows ?? [])
    .filter((row) => row.item_kind === "task_type" && row.task_type_id)
    .map((row) => row.task_type_id as string);
  const allTaskTypeIds = Array.from(
    new Set([
      ...directTaskTypeIds,
      ...Array.from(taskTypeIdsByGroupId.values()).flat(),
    ]),
  );

  const taskTypesById = new Map<string, TaskType>();
  if (allTaskTypeIds.length > 0) {
    const { data: taskTypes, error: taskTypesError } = await supabase
      .from("task_types")
      .select("*")
      .in("id", allTaskTypeIds);
    if (taskTypesError) throw taskTypesError;
    for (const taskType of taskTypes ?? [])
      taskTypesById.set(taskType.id, taskType);
  }

  return (itemRows ?? []).map((row): ResolvedIntakeItem => ({
    id: row.id,
    sortOrder: row.sort_order,
    itemKind: row.item_kind as ResolvedIntakeItem["itemKind"],
    fieldKey: row.field_key,
    fieldLabel: row.field_label,
    fieldType: row.field_type,
    config: (row.config ?? {}) as IntakeItemConfig,
    taskType: row.task_type_id
      ? (taskTypesById.get(row.task_type_id) ?? null)
      : null,
    taskGroupTaskTypes: row.task_group_id
      ? (taskTypeIdsByGroupId.get(row.task_group_id) ?? [])
          .map((id) => taskTypesById.get(id))
          .filter((taskType): taskType is TaskType => Boolean(taskType))
      : null,
  }));
}

export type WorkOrder = Tables<"work_orders">;
export type WorkOrderListItem = WorkOrder & { customerName: string | null };

export type ListWorkOrdersParams = {
  businessId: string;
  search?: string;
  status?: string;
  /** 1-indexed. */
  page?: number;
};

export type ListWorkOrdersResult = {
  orders: WorkOrderListItem[];
  total: number;
  page: number;
  pageSize: number;
};

/** Screen inventory #15: work orders list (search + filter by status). */
export async function listWorkOrders(
  supabase: SupabaseClient<Database>,
  { businessId, search, status, page = 1 }: ListWorkOrdersParams,
): Promise<ListWorkOrdersResult> {
  const pageSize = WORK_ORDERS_PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("work_orders")
    .select("*", { count: "exact" })
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (status) {
    query = query.eq("status", status);
  }

  const trimmed = search?.trim();
  if (trimmed) {
    const matchingCustomers = await supabase
      .from("customers")
      .select("id")
      .eq("business_id", businessId)
      .ilike("name", `%${trimmed}%`);
    const customerIds = (matchingCustomers.data ?? []).map((c) => c.id);

    const orParts = [`notes.ilike.%${trimmed}%`];
    const numericSearch = trimmed.replace(/[^0-9]/g, "");
    if (numericSearch) orParts.push(`number.eq.${numericSearch}`);
    if (customerIds.length > 0) {
      orParts.push(`customer_id.in.(${customerIds.join(",")})`);
    }
    query = query.or(orParts.join(","));
  }

  const { data, error, count } = await query;
  if (error) throw error;

  const orders = data ?? [];
  const customerIds = Array.from(
    new Set(
      orders
        .map((o) => o.customer_id)
        .filter((id): id is string => Boolean(id)),
    ),
  );

  let customerNameById = new Map<string, string>();
  if (customerIds.length > 0) {
    const { data: customers, error: customersError } = await supabase
      .from("customers")
      .select("id, name")
      .in("id", customerIds);
    if (customersError) throw customersError;
    customerNameById = new Map((customers ?? []).map((c) => [c.id, c.name]));
  }

  return {
    orders: orders.map((order) => ({
      ...order,
      customerName: order.customer_id
        ? (customerNameById.get(order.customer_id) ?? null)
        : null,
    })),
    total: count ?? 0,
    page,
    pageSize,
  };
}

export type WorkOrderWithTasks = WorkOrder & {
  customerName: string | null;
  templateName: string | null;
  tasks: (Tables<"runtime_tasks"> & { workStageName: string })[];
};

/** Minimal detail view for a generated order (the full Work-Order Hub is Slice 6). */
export async function getWorkOrderWithTasks(
  supabase: SupabaseClient<Database>,
  id: string,
): Promise<WorkOrderWithTasks | null> {
  const { data: order, error } = await supabase
    .from("work_orders")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!order) return null;

  const [tasksResult, customerResult, templateResult] = await Promise.all([
    supabase
      .from("runtime_tasks")
      .select("*")
      .eq("work_order_id", id)
      .order("sequence_order", { ascending: true }),
    order.customer_id
      ? supabase
          .from("customers")
          .select("name")
          .eq("id", order.customer_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from("intake_templates")
      .select("name")
      .eq("id", order.intake_template_id)
      .maybeSingle(),
  ]);
  if (tasksResult.error) throw tasksResult.error;
  if (customerResult.error) throw customerResult.error;
  if (templateResult.error) throw templateResult.error;

  const tasks = tasksResult.data ?? [];
  const stageIds = Array.from(new Set(tasks.map((t) => t.work_stage_id)));
  let stageNameById = new Map<string, string>();
  if (stageIds.length > 0) {
    const { data: stages, error: stagesError } = await supabase
      .from("work_stages")
      .select("id, name")
      .in("id", stageIds);
    if (stagesError) throw stagesError;
    stageNameById = new Map((stages ?? []).map((s) => [s.id, s.name]));
  }

  return {
    ...order,
    customerName: customerResult.data?.name ?? null,
    templateName: templateResult.data?.name ?? null,
    tasks: tasks.map((task) => ({
      ...task,
      workStageName: stageNameById.get(task.work_stage_id) ?? "",
    })),
  };
}
