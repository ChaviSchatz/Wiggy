import type { SupabaseClient } from "@supabase/supabase-js";

import { fetchBoardTasks, type BoardTask } from "@/lib/board/queries";
import {
  countUnhandledMissingItems,
  listMissingItems,
  type MissingItemListItem,
} from "@/lib/missing-items/queries";
import { fetchActiveSprint } from "@/lib/sprints/queries";
import type { Database } from "@/lib/supabase/database.types";
import { businessDayStart } from "@/lib/time/business-time";

/**
 * Dashboard / home (screen inventory #7): "counts by status, urgent, today's
 * work, missing-item alerts", role-tailored per
 * docs/ui/information-architecture.md. Two shapes, because the office roles
 * and a worker are asking genuinely different questions: office asks "what
 * needs attention across the salon", a worker asks "what am I doing".
 *
 * An order is "active" when it's neither a draft nor finished with -- the same
 * set the board draws from.
 */
const ACTIVE_ORDER_EXCLUDED_STATUSES = [
  "draft",
  "completed",
  "cancelled",
] as const;
const DUE_SOON_DAYS = 7;
const ATTENTION_LIST_LIMIT = 5;
// Missing items render grouped by kind (attention.missingItemGroups), so the
// fetch needs enough rows for the counts and per-kind rows to be meaningful,
// not just the first 5 across every kind.
const MISSING_ITEMS_ATTENTION_LIMIT = 20;

export type DashboardTaskItem = {
  id: string;
  title: string;
  workOrderId: string;
  orderNumber: number;
  customerName: string | null;
  assignedStaffMemberName: string | null;
};

export type OfficeDashboard = {
  activeOrders: number;
  urgentOrders: number;
  dueSoonOrders: number;
  awaitingApproval: number;
  deferredTasks: number;
  openMissingItems: number;
  sprint: {
    name: string | null;
    startsOn: string;
    endsOn: string;
    done: number;
    total: number;
  } | null;
  attention: {
    approvals: DashboardTaskItem[];
    deferred: DashboardTaskItem[];
    missingItems: MissingItemListItem[];
  };
};

export type WorkerDashboard = {
  /** Null when the user has no `staff_members` row -- no personal work at all. */
  staffMemberId: string | null;
  inProgress: DashboardTaskItem[];
  queued: number;
  awaitingApproval: number;
  completedToday: number;
};

export async function fetchOfficeDashboard(
  supabase: SupabaseClient<Database>,
  businessId: string,
): Promise<OfficeDashboard> {
  const [
    activeOrders,
    urgentOrders,
    dueSoonOrders,
    openMissingItems,
    tasks,
    missingItems,
    sprint,
  ] = await Promise.all([
    countActiveOrders(supabase, businessId),
    countActiveOrders(supabase, businessId, { urgentOnly: true }),
    countActiveOrders(supabase, businessId, { dueBefore: dueSoonCutoff() }),
    countUnhandledMissingItems(supabase, businessId),
    fetchBoardTasks(supabase, businessId),
    listMissingItems(supabase, {
      businessId,
      status: "unhandled",
      activeOrdersOnly: true,
      pageSize: MISSING_ITEMS_ATTENTION_LIMIT,
    }),
    fetchSprintProgress(supabase, businessId),
  ]);

  const awaitingApproval = tasks.filter(
    (task) => task.status === "awaiting_approval",
  );
  const deferred = tasks.filter((task) => task.status === "deferred");

  return {
    activeOrders,
    urgentOrders,
    dueSoonOrders,
    awaitingApproval: awaitingApproval.length,
    deferredTasks: deferred.length,
    openMissingItems,
    sprint,
    attention: {
      approvals: awaitingApproval
        .slice(0, ATTENTION_LIST_LIMIT)
        .map(toTaskItem),
      deferred: deferred.slice(0, ATTENTION_LIST_LIMIT).map(toTaskItem),
      missingItems: missingItems.items,
    },
  };
}

export async function fetchWorkerDashboard(
  supabase: SupabaseClient<Database>,
  businessId: string,
  staffMemberId: string | null,
  timezone: string,
): Promise<WorkerDashboard> {
  if (!staffMemberId) {
    return {
      staffMemberId: null,
      inProgress: [],
      queued: 0,
      awaitingApproval: 0,
      completedToday: 0,
    };
  }

  const [tasks, completedToday] = await Promise.all([
    fetchBoardTasks(supabase, businessId),
    countCompletedToday(supabase, businessId, staffMemberId, timezone),
  ]);

  const mine = tasks.filter(
    (task) => task.assigned_staff_member_id === staffMemberId,
  );

  return {
    staffMemberId,
    inProgress: mine
      .filter((task) => task.status === "in_progress")
      .map(toTaskItem),
    queued: mine.filter(
      (task) =>
        task.status === "pending" || task.status === "returned_for_rework",
    ).length,
    awaitingApproval: mine.filter((task) => task.status === "awaiting_approval")
      .length,
    completedToday,
  };
}

function toTaskItem(task: BoardTask): DashboardTaskItem {
  return {
    id: task.id,
    title: task.title,
    workOrderId: task.work_order_id,
    orderNumber: task.orderNumber,
    customerName: task.customerName,
    assignedStaffMemberName: task.assignedStaffMemberName,
  };
}

function dueSoonCutoff(): string {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + DUE_SOON_DAYS);
  return cutoff.toISOString();
}

async function countActiveOrders(
  supabase: SupabaseClient<Database>,
  businessId: string,
  options: { urgentOnly?: boolean; dueBefore?: string } = {},
): Promise<number> {
  let query = supabase
    .from("work_orders")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId)
    .not("status", "in", `(${ACTIVE_ORDER_EXCLUDED_STATUSES.join(",")})`);

  if (options.urgentOnly) {
    query = query.eq("priority", "urgent");
  }
  if (options.dueBefore) {
    query = query.not("due_at", "is", null).lte("due_at", options.dueBefore);
  }

  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

async function countCompletedToday(
  supabase: SupabaseClient<Database>,
  businessId: string,
  staffMemberId: string,
  timezone: string,
): Promise<number> {
  // The salon's midnight, not the server's -- a worker in Israel should see
  // their own day roll over, whatever zone the app happens to run in.
  const startOfToday = businessDayStart(new Date(), timezone);

  const { count, error } = await supabase
    .from("runtime_tasks")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId)
    .eq("assigned_staff_member_id", staffMemberId)
    .eq("status", "done")
    .gte("completed_at", startOfToday.toISOString());
  if (error) throw error;
  return count ?? 0;
}

/** Progress of the sprint currently being worked (ADR 0008), if there is one. */
async function fetchSprintProgress(
  supabase: SupabaseClient<Database>,
  businessId: string,
): Promise<OfficeDashboard["sprint"]> {
  const sprint = await fetchActiveSprint(supabase, businessId);
  if (!sprint) return null;

  const [totalResult, doneResult] = await Promise.all([
    supabase
      .from("runtime_tasks")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("sprint_id", sprint.id),
    supabase
      .from("runtime_tasks")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("sprint_id", sprint.id)
      .eq("status", "done"),
  ]);
  if (totalResult.error) throw totalResult.error;
  if (doneResult.error) throw doneResult.error;

  return {
    name: sprint.name,
    startsOn: sprint.starts_on,
    endsOn: sprint.ends_on,
    done: doneResult.count ?? 0,
    total: totalResult.count ?? 0,
  };
}
