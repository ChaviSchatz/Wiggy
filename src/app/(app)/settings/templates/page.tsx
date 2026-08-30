import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/layout/page-header";
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
import { can } from "@/lib/roles";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listIntakeTemplates } from "@/lib/work-definition/templates";
import { TemplateFormDialog } from "./template-form-dialog";
import { TemplateRowActions } from "./template-row-actions";

/** Intake templates list (screen inventory #50). */
export default async function TemplatesSettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!can(user.role, "editWorkDefinition")) redirect("/");

  const supabase = await createServerSupabaseClient();
  const templates = await listIntakeTemplates(supabase, user.businessId);

  const t = await getTranslations("pages.settings.templates");

  return (
    <div>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <div className="mb-4">
        <TemplateFormDialog />
      </div>

      {templates.length === 0 ? (
        <EmptyState
          title={t("emptyTitle")}
          description={t("emptyDescription")}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("columns.name")}</TableHead>
              <TableHead>{t("columns.items")}</TableHead>
              <TableHead>{t("columns.status")}</TableHead>
              <TableHead>{t("columns.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.map((template) => (
              <TableRow
                key={template.id}
                className={template.is_active ? undefined : "opacity-60"}
              >
                <TableCell>{template.name}</TableCell>
                <TableCell>{template.itemCount}</TableCell>
                <TableCell>
                  {template.is_active
                    ? t("status.active")
                    : t("status.inactive")}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/settings/templates/${template.id}`}>
                        {t("openBuilder")}
                      </Link>
                    </Button>
                    <TemplateRowActions template={template} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
