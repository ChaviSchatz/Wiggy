import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Pencil, PackageSearch, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getCurrentUser } from "@/lib/auth/server";
import { getCustomerById, type Customer } from "@/lib/customers/queries";
import { can } from "@/lib/roles";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { CustomerFormDialog } from "../customer-form-dialog";
import { DeleteCustomerDialog } from "../delete-customer-dialog";

export default async function CustomerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (!can(user.role, "editCustomers")) {
    redirect("/");
  }

  const supabase = await createServerSupabaseClient();
  const customer = await getCustomerById(supabase, params.id);
  if (!customer) {
    notFound();
  }

  return <CustomerDetailView customer={customer} />;
}

function CustomerDetailView({ customer }: { customer: Customer }) {
  const t = useTranslations("pages.customers");

  return (
    <div>
      <Link
        href="/customers"
        className="mb-4 inline-flex items-center gap-1 text-sm text-mauve-600 hover:underline"
      >
        <ArrowRight className="size-4" aria-hidden />
        {t("backToList")}
      </Link>

      <PageHeader title={customer.name} subtitle={t("detail.subtitle")} />

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t("detail.infoTitle")}</CardTitle>
            <div className="flex gap-2">
              <CustomerFormDialog
                customer={customer}
                trigger={
                  <Button variant="outline" size="sm">
                    <Pencil className="size-4" aria-hidden />
                    {t("edit")}
                  </Button>
                }
              />
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
