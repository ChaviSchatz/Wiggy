import { redirect } from "next/navigation";
import { useTranslations } from "next-intl";

import { PageHeader } from "@/components/layout/page-header";
import { getCurrentUser } from "@/lib/auth/server";
import { listCustomers } from "@/lib/customers/queries";
import { can } from "@/lib/roles";
import { fetchOpenSprints } from "@/lib/sprints/queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  fetchActiveIntakeTemplates,
  fetchResolvedIntakeItems,
} from "@/lib/work-orders/queries";
import type { ResolvedIntakeItem } from "@/lib/work-orders/types";
import { NewOrderWizard } from "./new-order-wizard";
import type { CustomerOption, SprintOption, TemplateOption } from "./wizard-types";

export default async function NewOrderPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (!can(user.role, "createOrders")) {
    redirect("/");
  }

  const supabase = await createServerSupabaseClient();

  const [{ customers }, templates, openSprints] = await Promise.all([
    listCustomers(supabase, { businessId: user.businessId, page: 1 }),
    fetchActiveIntakeTemplates(supabase, user.businessId),
    fetchOpenSprints(supabase, user.businessId),
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
  }));
  const sprintOptions: SprintOption[] = openSprints.map((s) => ({
    id: s.id,
    name: s.name,
    startsOn: s.starts_on,
    endsOn: s.ends_on,
  }));
  // The newest non-closed sprint -- same pick `fetchActiveSprint` makes --
  // is the sensible default; the wizard still lets the user change it.
  const defaultSprintId = sprintOptions[0]?.id ?? null;

  return (
    <NewOrderPageView
      customerOptions={customerOptions}
      templateOptions={templateOptions}
      itemsByTemplateId={itemsByTemplateId}
      sprintOptions={sprintOptions}
      defaultSprintId={defaultSprintId}
    />
  );
}

function NewOrderPageView({
  customerOptions,
  templateOptions,
  itemsByTemplateId,
  sprintOptions,
  defaultSprintId,
}: {
  customerOptions: CustomerOption[];
  templateOptions: TemplateOption[];
  itemsByTemplateId: Record<string, ResolvedIntakeItem[]>;
  sprintOptions: SprintOption[];
  defaultSprintId: string | null;
}) {
  const t = useTranslations("pages.orders.wizard");

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <NewOrderWizard
        initialCustomers={customerOptions}
        templates={templateOptions}
        itemsByTemplateId={itemsByTemplateId}
        sprintOptions={sprintOptions}
        defaultSprintId={defaultSprintId}
      />
    </div>
  );
}
