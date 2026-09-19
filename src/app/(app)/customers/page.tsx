import { redirect } from "next/navigation";
import { useTranslations } from "next-intl";

import { PageHeader } from "@/components/layout/page-header";
import { getCurrentUser } from "@/lib/auth/server";
import { listCustomers, type Customer } from "@/lib/customers/queries";
import { can } from "@/lib/roles";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { CustomersPageClient } from "./customers-page-client";

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

function CustomersView(props: {
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
      <CustomersPageClient {...props} />
    </div>
  );
}
