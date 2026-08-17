import type { SupabaseClient } from "@supabase/supabase-js";

import { fetchActivityForWorkOrder, type ActivityEntry } from "@/lib/activity/queries";
import {
  fetchAttachmentsForParent,
  type AttachmentWithUrl,
} from "@/lib/attachments/queries";
import { fetchCommentsForWorkOrder, type CommentWithAuthor } from "@/lib/comments/queries";
import type { Database, Tables } from "@/lib/supabase/database.types";
import type { WorkOrder } from "./queries";

export type HubTask = Tables<"runtime_tasks"> & {
  workStageName: string;
  workStageSortOrder: number;
  taskTypeName: string | null;
  assignedStaffMemberName: string | null;
  approverStaffMemberName: string | null;
};

export type HubData = {
  order: WorkOrder & {
    customerName: string | null;
    customerPhone: string | null;
    customerEmail: string | null;
    templateName: string | null;
  };
  tasks: HubTask[];
  workStages: Tables<"work_stages">[];
  comments: CommentWithAuthor[];
  attachments: AttachmentWithUrl[];
  activity: ActivityEntry[];
  missingItems: Tables<"missing_items">[];
  staff: { id: string; full_name: string }[];
  taskTypes: Tables<"task_types">[];
};

/**
 * Everything the Work-Order Hub full page needs (docs/ui/work-order-hub.md),
 * batched into a handful of queries rather than one giant embedded-relation
 * select -- same approach as `getWorkOrderWithTasks` and `fetchBoardTasks`.
 */
export async function getHubData(
  supabase: SupabaseClient<Database>,
  businessId: string,
  workOrderId: string,
): Promise<HubData | null> {
  const { data: order, error: orderError } = await supabase
    .from("work_orders")
    .select("*")
    .eq("id", workOrderId)
    .maybeSingle();
  if (orderError) throw orderError;
  if (!order) return null;

  const [
    tasksResult,
    customerResult,
    templateResult,
    workStagesResult,
    staffResult,
    taskTypesResult,
    comments,
    attachments,
    activity,
    missingItemsResult,
  ] = await Promise.all([
    supabase
      .from("runtime_tasks")
      .select("*")
      .eq("work_order_id", workOrderId)
      .order("sequence_order", { ascending: true }),
    order.customer_id
      ? supabase
          .from("customers")
          .select("name, phone, email")
          .eq("id", order.customer_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from("intake_templates")
      .select("name")
      .eq("id", order.intake_template_id)
      .maybeSingle(),
    supabase
      .from("work_stages")
      .select("*")
      .eq("business_id", businessId)
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("staff_members")
      .select("id, full_name")
      .eq("business_id", businessId)
      .eq("is_active", true)
      .order("full_name", { ascending: true }),
    supabase
      .from("task_types")
      .select("*")
      .eq("business_id", businessId)
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    fetchCommentsForWorkOrder(supabase, workOrderId),
    fetchAttachmentsForParent(supabase, "work_order", workOrderId),
    fetchActivityForWorkOrder(supabase, workOrderId),
    supabase
      .from("missing_items")
      .select("*")
      .eq("work_order_id", workOrderId)
      .order("created_at", { ascending: false }),
  ]);
  if (tasksResult.error) throw tasksResult.error;
  if (customerResult.error) throw customerResult.error;
  if (templateResult.error) throw templateResult.error;
  if (workStagesResult.error) throw workStagesResult.error;
  if (staffResult.error) throw staffResult.error;
  if (taskTypesResult.error) throw taskTypesResult.error;
  if (missingItemsResult.error) throw missingItemsResult.error;

  const tasks = tasksResult.data ?? [];
  const stages = workStagesResult.data ?? [];
  const stageById = new Map(stages.map((s) => [s.id, s]));

  const staffIds = Array.from(
    new Set(
      tasks
        .flatMap((t) => [t.assigned_staff_member_id, t.approver_staff_member_id])
        .filter((id): id is string => Boolean(id)),
    ),
  );
  const taskTypeIds = Array.from(
    new Set(tasks.map((t) => t.task_type_id).filter((id): id is string => Boolean(id))),
  );

  const [staffNamesResult, taskTypeNamesResult] = await Promise.all([
    staffIds.length > 0
      ? supabase.from("staff_members").select("id, full_name").in("id", staffIds)
      : Promise.resolve({ data: [], error: null }),
    taskTypeIds.length > 0
      ? supabase.from("task_types").select("id, name").in("id", taskTypeIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (staffNamesResult.error) throw staffNamesResult.error;
  if (taskTypeNamesResult.error) throw taskTypeNamesResult.error;

  const staffNameById = new Map(
    (staffNamesResult.data ?? []).map((s) => [s.id, s.full_name]),
  );
  const taskTypeNameById = new Map(
    (taskTypeNamesResult.data ?? []).map((t) => [t.id, t.name]),
  );

  const hubTasks: HubTask[] = tasks.map((task) => {
    const stage = stageById.get(task.work_stage_id);
    return {
      ...task,
      workStageName: stage?.name ?? "",
      workStageSortOrder: stage?.sort_order ?? 0,
      taskTypeName: task.task_type_id
        ? (taskTypeNameById.get(task.task_type_id) ?? null)
        : null,
      assignedStaffMemberName: task.assigned_staff_member_id
        ? (staffNameById.get(task.assigned_staff_member_id) ?? null)
        : null,
      approverStaffMemberName: task.approver_staff_member_id
        ? (staffNameById.get(task.approver_staff_member_id) ?? null)
        : null,
    };
  });

  return {
    order: {
      ...order,
      customerName: customerResult.data?.name ?? null,
      customerPhone: customerResult.data?.phone ?? null,
      customerEmail: customerResult.data?.email ?? null,
      templateName: templateResult.data?.name ?? null,
    },
    tasks: hubTasks,
    workStages: stages,
    comments,
    attachments,
    activity,
    missingItems: missingItemsResult.data ?? [],
    staff: staffResult.data ?? [],
    taskTypes: taskTypesResult.data ?? [],
  };
}
