import { redirect } from "next/navigation";
import { Plus, Users } from "lucide-react";
import { useTranslations } from "next-intl";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar } from "@/components/ui/filter-bar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCurrentUser } from "@/lib/auth/server";
import { listCustomers, type Customer } from "@/lib/customers/queries";
import { can } from "@/lib/roles";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { CustomerFormDialog } from "./customer-form-dialog";
import { CustomerRowActions } from "./customer-row-actions";
import { CustomerSearchBar } from "./customer-search-bar";
import { CustomerTableRow } from "./customer-table-row";
import { CustomersPagination } from "./customers-pagination";

type SearchParams = { [key: string]: string | string[] | undefined };

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (!can(user.role, "editCustomers")) {
    redirect("/");
  }

  const search = firstParam(searchParams.q) ?? "";
  const page = Number(firstParam(searchParams.page) ?? "1") || 1;

  const supabase = await createServerSupabaseClient();
  const { customers, total, pageSize } = await listCustomers(supabase, {
    businessId: user.businessId,
    search,
    page,
  });

  return (
    <CustomersView
      customers={customers}
      total={total}
      page={page}
      pageSize={pageSize}
      search={search}
    />
  );
}

function CustomersView({
  customers,
  total,
  page,
  pageSize,
  search,
}: {
  customers: Customer[];
  total: number;
  page: number;
  pageSize: number;
  search: string;
}) {
  const t = useTranslations("pages.customers");

  return (
    <div>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <FilterBar
        search={<CustomerSearchBar defaultValue={search} />}
        actions={
          <CustomerFormDialog
            trigger={
              <Button size="sm" className="ms-auto">
                <Plus className="size-4" aria-hidden />
                {t("newCustomer")}
              </Button>
            }
          />
        }
      />

      {customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title={search ? t("emptySearchTitle") : t("emptyTitle")}
          description={
            search ? t("emptySearchDescription") : t("emptyDescription")
          }
          action={
            !search ? (
              <CustomerFormDialog
                trigger={
                  <Button size="sm">
                    <Plus className="size-4" aria-hidden />
                    {t("newCustomer")}
                  </Button>
                }
              />
            ) : undefined
          }
        />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("form.nameLabel")}</TableHead>
                <TableHead>{t("form.phoneLabel")}</TableHead>
                <TableHead>{t("form.emailLabel")}</TableHead>
                <TableHead className="text-end">{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <CustomerTableRow
                  key={customer.id}
                  href={`/customers/${customer.id}`}
                >
                  <TableCell className="text-identity">
                    {customer.name}
                  </TableCell>
                  <TableCell className="text-muted">
                    {customer.phone ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted">
                    {customer.email ?? "—"}
                  </TableCell>
                  <TableCell>
                    <CustomerRowActions customer={customer} />
                  </TableCell>
                </CustomerTableRow>
              ))}
            </TableBody>
          </Table>
          <CustomersPagination
            page={page}
            pageSize={pageSize}
            total={total}
            search={search}
          />
        </>
      )}
    </div>
  );
}
