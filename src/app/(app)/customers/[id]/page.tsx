import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { PageHeader } from "@/components/layout/page-header";
import { getCurrentUser } from "@/lib/auth/server";
import { getCustomerById, type Customer } from "@/lib/customers/queries";
import { can } from "@/lib/roles";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { CustomerDetailClient } from "../customer-detail-client";

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

      <CustomerDetailClient customer={customer} />
    </div>
  );
}
