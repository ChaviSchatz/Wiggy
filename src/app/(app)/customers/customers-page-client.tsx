"use client";

import { useState } from "react";
import { Plus, User, UserPlus, Users } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { DetailPanel } from "@/components/ui/detail-panel";
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
import type { Customer } from "@/lib/customers/queries";
import { CustomerPanel } from "./customer-panel";
import { CustomerRowActions } from "./customer-row-actions";
import { CustomerSearchBar } from "./customer-search-bar";
import { CustomerTableRow } from "./customer-table-row";
import { CustomersPagination } from "./customers-pagination";

type PanelState = { kind: "create" } | { kind: "edit"; customer: Customer };

export function CustomersPageClient({
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
  const [panel, setPanel] = useState<PanelState | null>(null);
  const close = () => setPanel(null);
  const openCreate = () => setPanel({ kind: "create" });

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <div className="flex-1 min-w-0">
        <FilterBar
          search={<CustomerSearchBar defaultValue={search} />}
          actions={
            <Button size="sm" className="ms-auto" onClick={openCreate}>
              <Plus className="size-4" aria-hidden />
              {t("newCustomer")}
            </Button>
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
                <Button size="sm" onClick={openCreate}>
                  <Plus className="size-4" aria-hidden />
                  {t("newCustomer")}
                </Button>
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
                    highlighted={
                      panel?.kind === "edit" &&
                      panel.customer.id === customer.id
                    }
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
                      <CustomerRowActions
                        customer={customer}
                        onEdit={() => setPanel({ kind: "edit", customer })}
                      />
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

      {panel ? (
        <DetailPanel
          leading={
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-mauve-100 text-mauve-600">
              {panel.kind === "create" ? (
                <UserPlus className="size-5" aria-hidden />
              ) : (
                <User className="size-5" aria-hidden />
              )}
            </span>
          }
          title={
            panel.kind === "create"
              ? t("form.createTitle")
              : t("form.editTitle")
          }
          subtitle={panel.kind === "edit" ? panel.customer.name : undefined}
          closeLabel={t("form.close")}
          onClose={close}
        >
          <CustomerPanel
            key={panel.kind === "edit" ? panel.customer.id : "create"}
            customer={panel.kind === "edit" ? panel.customer : undefined}
            onDone={close}
          />
        </DetailPanel>
      ) : null}
    </div>
  );
}
