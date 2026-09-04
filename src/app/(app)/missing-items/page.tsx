import { redirect } from "next/navigation";
import Link from "next/link";
import { PackageX, Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { PageHeader } from "@/components/layout/page-header";
import { Avatar } from "@/components/ui/avatar";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
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
import {
  fetchAssignableStaff,
  type AssignableStaffMember,
} from "@/lib/board/queries";
import {
  fetchMissingItemOrderOptions,
  listMissingItems,
  type MissingItemListItem,
  type MissingItemOrderOption,
} from "@/lib/missing-items/queries";
import { can } from "@/lib/roles";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { CreateMissingItemDialog } from "./create-missing-item-dialog";
import { HandleMissingItemDialog } from "./handle-missing-item-dialog";
import {
  MissingItemFilterBar,
  type MissingItemFilters,
} from "./missing-item-filter-bar";
import { MissingItemsPagination } from "./missing-items-pagination";

type SearchParams = { [key: string]: string | string[] | undefined };

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Screen inventory #29. The list opens on what still needs chasing
 * ("open items"), which in practice means every status short of `handled` --
 * an item that was found or ordered but not yet handled is still work.
 */
export default async function MissingItemsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (!can(user.role, "manageMissingItems")) {
    redirect("/");
  }

  const filters: MissingItemFilters = {
    status: firstParam(searchParams.status) ?? "unhandled",
    kind: firstParam(searchParams.kind) ?? "",
    responsible: firstParam(searchParams.responsible) ?? "",
  };
  const page = Number(firstParam(searchParams.page) ?? "1") || 1;

  const supabase = await createServerSupabaseClient();
  const [{ items, total, pageSize }, staff, orderOptions] = await Promise.all([
    listMissingItems(supabase, {
      businessId: user.businessId,
      status: filters.status === "all" ? undefined : filters.status,
      kind: filters.kind || undefined,
      responsibleStaffMemberId: filters.responsible || undefined,
      page,
    }),
    fetchAssignableStaff(supabase, user.businessId),
    fetchMissingItemOrderOptions(supabase, user.businessId),
  ]);

  return (
    <MissingItemsView
      items={items}
      total={total}
      page={page}
      pageSize={pageSize}
      filters={filters}
      staff={staff}
      orderOptions={orderOptions}
    />
  );
}

/** Open is the loud one; found/ordered are in-flight; handled is done. */
function statusVariant(status: string): BadgeVariant {
  if (status === "handled") return "success";
  if (status === "open") return "danger";
  return "warning";
}

function MissingItemsView({
  items,
  total,
  page,
  pageSize,
  filters,
  staff,
  orderOptions,
}: {
  items: MissingItemListItem[];
  total: number;
  page: number;
  pageSize: number;
  filters: MissingItemFilters;
  staff: AssignableStaffMember[];
  orderOptions: MissingItemOrderOption[];
}) {
  const t = useTranslations("pages.missingItems");
  const isFiltered =
    filters.status !== "unhandled" ||
    Boolean(filters.kind || filters.responsible);

  const createButton = (
    <CreateMissingItemDialog
      staff={staff}
      orderOptions={orderOptions}
      trigger={
        <Button size="sm">
          <Plus className="size-4" aria-hidden />
          {t("newItem")}
        </Button>
      }
    />
  );

  return (
    <div>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <MissingItemFilterBar filters={filters} staff={staff} />
        {createButton}
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={PackageX}
          title={isFiltered ? t("emptyFilteredTitle") : t("emptyTitle")}
          description={
            isFiltered ? t("emptyFilteredDescription") : t("emptyDescription")
          }
          action={isFiltered ? undefined : createButton}
        />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("columns.kind")}</TableHead>
                <TableHead>{t("columns.order")}</TableHead>
                <TableHead>{t("columns.description")}</TableHead>
                <TableHead>{t("columns.responsible")}</TableHead>
                <TableHead>{t("columns.status")}</TableHead>
                <TableHead className="text-end">
                  {t("columns.actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {t(`kind.${item.kind}`)}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/orders/${item.work_order_id}`}
                      className="hover:underline"
                    >
                      {t("orderLine", {
                        number: item.orderNumber,
                        customer: item.customerName ?? t("noCustomer"),
                      })}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted">
                    {item.description ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted">
                    {item.responsibleName ? (
                      <span className="flex items-center gap-2">
                        <Avatar name={item.responsibleName} size="sm" />
                        {item.responsibleName}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(item.status)}>
                      {t(`status.${item.status}`)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <HandleMissingItemDialog
                        item={item}
                        staff={staff}
                        trigger={
                          <Button variant="outline" size="sm">
                            {t("handle")}
                          </Button>
                        }
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <MissingItemsPagination
            page={page}
            pageSize={pageSize}
            total={total}
            filters={filters}
          />
        </>
      )}
    </div>
  );
}
