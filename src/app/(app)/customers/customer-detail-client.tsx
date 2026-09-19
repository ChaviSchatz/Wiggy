"use client";

import { useState } from "react";
import { PackageSearch, Pencil, Trash2, User } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DetailPanel } from "@/components/ui/detail-panel";
import { EmptyState } from "@/components/ui/empty-state";
import type { Customer } from "@/lib/customers/queries";
import { CustomerPanel } from "./customer-panel";
import { DeleteCustomerDialog } from "./delete-customer-dialog";
import { WhatsappMark } from "./whatsapp-mark";

export function CustomerDetailClient({ customer }: { customer: Customer }) {
  const t = useTranslations("pages.customers");
  const [editing, setEditing] = useState(false);

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <div className="grid flex-1 min-w-0 gap-4 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t("detail.infoTitle")}</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(true)}
              >
                <Pencil className="size-4" aria-hidden />
                {t("edit")}
              </Button>
              <DeleteCustomerDialog
                customer={customer}
                redirectTo="/customers"
                trigger={
                  <Button variant="outline" size="sm">
                    <Trash2 className="size-4" aria-hidden />
                    {t("delete.title")}
                  </Button>
                }
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <DetailRow label={t("form.phoneLabel")} value={customer.phone} />
            <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
              <span className="w-28 shrink-0 text-muted">
                {t("whatsapp.column")}
              </span>
              <WhatsappMark value={customer.has_whatsapp} />
            </div>
            <DetailRow label={t("form.emailLabel")} value={customer.email} />
            <DetailRow label={t("form.notesLabel")} value={customer.notes} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("detail.ordersTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={PackageSearch}
              title={t("detail.noOrdersTitle")}
              description={t("detail.noOrdersDescription")}
            />
          </CardContent>
        </Card>
      </div>

      {editing ? (
        <DetailPanel
          leading={
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-mauve-100 text-mauve-600">
              <User className="size-5" aria-hidden />
            </span>
          }
          title={t("form.editTitle")}
          subtitle={customer.name}
          closeLabel={t("form.close")}
          onClose={() => setEditing(false)}
        >
          <CustomerPanel
            customer={customer}
            onDone={() => setEditing(false)}
          />
        </DetailPanel>
      ) : null}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
      <span className="w-28 shrink-0 text-muted">{label}</span>
      <span className="text-ink">{value ?? "—"}</span>
    </div>
  );
}
