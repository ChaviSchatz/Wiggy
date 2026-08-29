import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/server";
import { visibleSettingsSections } from "./sections";

/** Settings hub (screen inventory #44). */
export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const sections = visibleSettingsSections(user.role);
  if (sections.length === 0) redirect("/");

  const t = await getTranslations("pages.settings");

  return (
    <div>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <div className="grid gap-3 sm:grid-cols-2">
        {sections.map((section) => (
          <Link key={section.key} href={section.href} className="block">
            <Card className="h-full transition-colors hover:border-line-strong">
              <CardContent className="flex items-start gap-3 p-4">
                <section.icon
                  className="mt-0.5 size-5 shrink-0 text-muted"
                  aria-hidden
                />
                <div>
                  <CardTitle className="text-base">
                    {t(`sections.${section.key}.title`)}
                  </CardTitle>
                  <p className="mt-1 text-body text-muted">
                    {t(`sections.${section.key}.description`)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
