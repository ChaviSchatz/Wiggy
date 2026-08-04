import { redirect } from "next/navigation";
import { useTranslations } from "next-intl";

import { PageHeader } from "@/components/layout/page-header";
import { getCurrentUser } from "@/lib/auth/server";
import { listCustomers } from "@/lib/customers/queries";
import { can } from "@/lib/roles";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  fetchActiveIntakeTemplates,
  fetchResolvedIntakeItems,
} from "@/lib/work-orders/queries";
import type { ResolvedIntakeItem } from "@/lib/work-orders/types";
import { NewOrderWizard } from "./new-order-wizard";
import type { CustomerOption, TemplateOption } from "./wizard-types";

export default async function NewOrderPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (!can(user.role, "createOrders")) {
    redirect("/");
  }

  const supabase = await createServerSupabaseClient();

  const [{ customers }, templates] = await Promise.all([
    listCustomers(supabase, { businessId: user.businessId, page: 1 }),
    fetchActiveIntakeTemplates(supabase, user.businessId),
  ]);

  const itemsByTemplateId: Record<string, ResolvedIntakeItem[]> = {};
  await Promise.all(
    templates.map(async (template) => {
      itemsByTemplateId[template.id] = await fetchResolvedIntakeItems(
        supabase,
        template.id,
      );
    }),
  );

  const customerOptions: CustomerOption[] = customers.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    email: c.email,
  }));
  const templateOptions: TemplateOption[] = templates.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    workOrderKind: t.work_order_kind,
  }));

  return (
    <NewOrderPageView
      customerOptions={customerOptions}
      templateOptions={templateOptions}
      itemsByTemplateId={itemsByTemplateId}
    />
  );
}

function NewOrderPageView({
  customerOptions,
  templateOptions,
  itemsByTemplateId,
}: {
  customerOptions: CustomerOption[];
  templateOptions: TemplateOption[];
  itemsByTemplateId: Record<string, ResolvedIntakeItem[]>;
}) {
  const t = useTranslations("pages.orders.wizard");

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <NewOrderWizard
        initialCustomers={customerOptions}
        templates={templateOptions}
        itemsByTemplateId={itemsByTemplateId}
      />
    </div>
  );
}
