import { redirect } from "next/navigation";
import Link from "next/link";
import { ClipboardList, Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { PageHeader } from "@/components/layout/page-header";
import { StatusChip } from "@/components/domain/status-chip";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCurrentUser } from "@/lib/auth/server";
import { can } from "@/lib/roles";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  listWorkOrders,
  WORK_ORDER_SORTS,
  type WorkOrderListItem,
  type WorkOrderSort,
} from "@/lib/work-orders/queries";
import { OrderFilters } from "./order-filters";
import { OrdersPagination } from "./orders-pagination";

type SearchParams = { [key: string]: string | string[] | undefined };

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (!can(user.role, "createOrders")) {
    redirect("/");
  }

  const search = firstParam(searchParams.q) ?? "";
  const status = firstParam(searchParams.status) ?? "";
  const priority = firstParam(searchParams.priority) ?? "";
  const dueSoon = firstParam(searchParams.dueSoon) === "true";
  const sortParam = firstParam(searchParams.sort) ?? "recent";
  const sort = (
    WORK_ORDER_SORTS as readonly string[]
  ).includes(sortParam)
    ? (sortParam as WorkOrderSort)
    : "recent";
  const page = Number(firstParam(searchParams.page) ?? "1") || 1;

  const supabase = await createServerSupabaseClient();
  const { orders, total, pageSize } = await listWorkOrders(supabase, {
    businessId: user.businessId,
    search,
    status: status || undefined,
    priority: priority || undefined,
    dueSoon,
    sort,
    page,
  });

  return (
    <OrdersView
      orders={orders}
      total={total}
      page={page}
      pageSize={pageSize}
      search={search}
      status={status}
      priority={priority}
      dueSoon={dueSoon}
      sort={sort}
      canCreate={can(user.role, "createOrders")}
    />
  );
}

function OrdersView({
  orders,
  total,
  page,
  pageSize,
  search,
  status,
  priority,
  dueSoon,
  sort,
  canCreate,
}: {
  orders: WorkOrderListItem[];
  total: number;
  page: number;
  pageSize: number;
  search: string;
  status: string;
  priority: string;
  dueSoon: boolean;
  sort: WorkOrderSort;
  canCreate: boolean;
}) {
  const t = useTranslations("pages.orders");
  const hasFilters = Boolean(search || status || priority || dueSoon);

  return (
    <div>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <OrderFilters
          defaultSearch={search}
          defaultStatus={status}
          defaultPriority={priority}
          defaultDueSoon={dueSoon}
          defaultSort={sort}
        />
        {canCreate ? (
          <Button size="sm" asChild>
            <Link href="/orders/new">
              <Plus className="size-4" aria-hidden />
              {t("newOrder")}
            </Link>
          </Button>
        ) : null}
      </div>

      {orders.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={hasFilters ? t("emptySearchTitle") : t("emptyTitle")}
          description={
            hasFilters ? t("emptySearchDescription") : t("emptyDescription")
          }
          action={
            !hasFilters && canCreate ? (
              <Button size="sm" asChild>
                <Link href="/orders/new">
                  <Plus className="size-4" aria-hidden />
                  {t("newOrder")}
                </Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("columns.number")}</TableHead>
                <TableHead>{t("columns.identity")}</TableHead>
                <TableHead>{t("columns.status")}</TableHead>
                <TableHead>{t("columns.priority")}</TableHead>
                <TableHead className="text-end">
                  {t("columns.receivedDate")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium tabular-nums">
                    <Link
                      href={`/orders/${order.id}`}
                      className="hover:underline"
                    >
                      #{order.number}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {order.customerName ?? order.template_name ?? ""}
                  </TableCell>
                  <TableCell>
                    <StatusChip
                      kind="order"
                      status={order.status}
                      label={t(`status.${order.status}`)}
                    />
                  </TableCell>
                  <TableCell>
                    <StatusChip
                      kind="urgency"
                      status={order.priority}
                      label={t("priority.urgent")}
                    />
                  </TableCell>
                  <TableCell className="text-end text-muted">
                    {order.order_received_date}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <OrdersPagination
            page={page}
            pageSize={pageSize}
            total={total}
            search={search}
            status={status}
            priority={priority}
            dueSoon={dueSoon}
            sort={sort}
          />
        </>
      )}
    </div>
  );
}
