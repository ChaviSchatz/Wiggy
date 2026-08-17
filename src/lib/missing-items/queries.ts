import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Tables } from "@/lib/supabase/database.types";

export type MissingItem = Tables<"missing_items">;

export type MissingItemListItem = MissingItem & {
  orderNumber: number;
  orderStatus: string;
  customerName: string | null;
  responsibleName: string | null;
};

export const MISSING_ITEMS_PAGE_SIZE = 20;

/**
 * A missing item stops being an alert once its order is done with
 * (architecture §4.4: "surfaced on the dashboard until handled or the order
 * completes"). Cancelled belongs here for the same reason: nobody is going to
 * chase a top for an order that no longer exists.
 */
const CLOSED_ORDER_STATUSES = ["completed", "cancelled"] as const;

export type ListMissingItemsParams = {
  businessId: string;
  /** One of the four statuses, or `unhandled` for "everything still open". */
  status?: string;
  kind?: string;
  responsibleStaffMemberId?: string;
  /** Drop items belonging to a completed/cancelled order. */
  activeOrdersOnly?: boolean;
  /** 1-indexed. */
  page?: number;
  pageSize?: number;
};

export type ListMissingItemsResult = {
  items: MissingItemListItem[];
  total: number;
  page: number;
  pageSize: number;
};

/**
 * Screen inventory #29: the missing-items list, filterable by kind, status and
 * responsible staff member. Joins are done as explicit follow-up queries
 * rather than embedded relations, matching the rest of the codebase
 * (see `src/lib/work-orders/queries.ts`).
 */
export async function listMissingItems(
  supabase: SupabaseClient<Database>,
  {
    businessId,
    status,
    kind,
    responsibleStaffMemberId,
    activeOrdersOnly = false,
    page = 1,
    pageSize = MISSING_ITEMS_PAGE_SIZE,
  }: ListMissingItemsParams,
): Promise<ListMissingItemsResult> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let activeOrderIds: string[] | null = null;
  if (activeOrdersOnly) {
    activeOrderIds = await fetchActiveWorkOrderIds(supabase, businessId);
    if (activeOrderIds.length === 0) {
      return { items: [], total: 0, page, pageSize };
    }
  }

  let query = supabase
    .from("missing_items")
    .select("*", { count: "exact" })
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (status === "unhandled") {
    query = query.neq("status", "handled");
  } else if (status) {
    query = query.eq("status", status);
  }
  if (kind) {
    query = query.eq("kind", kind);
  }
  if (responsibleStaffMemberId) {
    query = query.eq("responsible_staff_member_id", responsibleStaffMemberId);
  }
  if (activeOrderIds) {
    query = query.in("work_order_id", activeOrderIds);
  }

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    items: await withRelatedNames(supabase, data ?? []),
    total: count ?? 0,
    page,
    pageSize,
  };
}

/**
 * The dashboard's missing-item alert count (screen inventory #7): everything
 * not yet handled, on an order that is still live.
 */
export async function countUnhandledMissingItems(
  supabase: SupabaseClient<Database>,
  businessId: string,
): Promise<number> {
  const activeOrderIds = await fetchActiveWorkOrderIds(supabase, businessId);
  if (activeOrderIds.length === 0) return 0;

  const { count, error } = await supabase
    .from("missing_items")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId)
    .neq("status", "handled")
    .in("work_order_id", activeOrderIds);
  if (error) throw error;
  return count ?? 0;
}

export type MissingItemOrderOption = {
  id: string;
  number: number;
  customerName: string | null;
};

/** Order picker for "create missing item manually" (screen inventory #31). */
export async function fetchMissingItemOrderOptions(
  supabase: SupabaseClient<Database>,
  businessId: string,
): Promise<MissingItemOrderOption[]> {
  const { data, error } = await supabase
    .from("work_orders")
    .select("id, number, customer_id")
    .eq("business_id", businessId)
    .not("status", "in", `(${CLOSED_ORDER_STATUSES.join(",")})`)
    .order("number", { ascending: false });
  if (error) throw error;

  const orders = data ?? [];
  const customerNameById = await fetchCustomerNames(
    supabase,
    orders.map((order) => order.customer_id),
  );

  return orders.map((order) => ({
    id: order.id,
    number: order.number,
    customerName: order.customer_id
      ? (customerNameById.get(order.customer_id) ?? null)
      : null,
  }));
}

async function fetchActiveWorkOrderIds(
  supabase: SupabaseClient<Database>,
  businessId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("work_orders")
    .select("id")
    .eq("business_id", businessId)
    .not("status", "in", `(${CLOSED_ORDER_STATUSES.join(",")})`);
  if (error) throw error;
  return (data ?? []).map((order) => order.id);
}

async function fetchCustomerNames(
  supabase: SupabaseClient<Database>,
  customerIds: (string | null)[],
): Promise<Map<string, string>> {
  const ids = Array.from(
    new Set(customerIds.filter((id): id is string => Boolean(id))),
  );
  if (ids.length === 0) return new Map();

  const { data, error } = await supabase
    .from("customers")
    .select("id, name")
    .in("id", ids);
  if (error) throw error;
  return new Map((data ?? []).map((customer) => [customer.id, customer.name]));
}

/** Decorates raw rows with the order/customer/staff names the list renders. */
async function withRelatedNames(
  supabase: SupabaseClient<Database>,
  items: MissingItem[],
): Promise<MissingItemListItem[]> {
  if (items.length === 0) return [];

  const workOrderIds = Array.from(
    new Set(items.map((item) => item.work_order_id)),
  );
  const staffIds = Array.from(
    new Set(
      items
        .map((item) => item.responsible_staff_member_id)
        .filter((id): id is string => Boolean(id)),
    ),
  );

  const [ordersResult, staffResult] = await Promise.all([
    supabase
      .from("work_orders")
      .select("id, number, status, customer_id")
      .in("id", workOrderIds),
    staffIds.length > 0
      ? supabase.from("staff_members").select("id, full_name").in("id", staffIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (ordersResult.error) throw ordersResult.error;
  if (staffResult.error) throw staffResult.error;

  const orders = ordersResult.data ?? [];
  const orderById = new Map(orders.map((order) => [order.id, order]));
  const staffNameById = new Map(
    (staffResult.data ?? []).map((staff) => [staff.id, staff.full_name]),
  );
  const customerNameById = await fetchCustomerNames(
    supabase,
    orders.map((order) => order.customer_id),
  );

  return items.map((item) => {
    const order = orderById.get(item.work_order_id);
    return {
      ...item,
      orderNumber: order?.number ?? 0,
      orderStatus: order?.status ?? "",
      customerName: order?.customer_id
        ? (customerNameById.get(order.customer_id) ?? null)
        : null,
      responsibleName: item.responsible_staff_member_id
        ? (staffNameById.get(item.responsible_staff_member_id) ?? null)
        : null,
    };
  });
}
