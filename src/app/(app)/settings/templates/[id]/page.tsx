import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/layout/page-header";
import { getCurrentUser } from "@/lib/auth/server";
import { can } from "@/lib/roles";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  listCatalogOptions,
  listTemplateItems,
} from "@/lib/work-definition/template-items";
import { getIntakeTemplate } from "@/lib/work-definition/templates";
import { fetchActiveWorkStages } from "@/lib/work-orders/queries";
import { AddItemDialog } from "./add-item-dialog";
import { ItemList } from "./item-list";

/** Intake template builder (screen inventory #51). */
export default async function TemplateBuilderPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!can(user.role, "editWorkDefinition")) redirect("/");

  const supabase = await createServerSupabaseClient();
  const template = await getIntakeTemplate(
    supabase,
    params.id,
    user.businessId,
  );
  if (!template) notFound();

  const [items, catalog, stages] = await Promise.all([
    listTemplateItems(supabase, template.id),
    listCatalogOptions(supabase, user.businessId),
    fetchActiveWorkStages(supabase, user.businessId),
  ]);

  const t = await getTranslations("pages.settings.templates");
  const stageOptions = stages.map((stage) => ({
    id: stage.id,
    name: stage.name,
  }));

  return (
    <div>
      <Link
        href="/settings/templates"
        className="text-body text-muted underline-offset-4 hover:underline"
      >
        {t("builder.back")}
      </Link>

      <PageHeader title={template.name} />

      <div className="mb-4">
        <AddItemDialog
          templateId={template.id}
          taskTypes={catalog.taskTypes}
          taskGroups={catalog.taskGroups}
        />
      </div>

      <ItemList templateId={template.id} items={items} stages={stageOptions} />
    </div>
  );
}
