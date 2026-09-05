import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/layout/page-header";
import { getCurrentUser } from "@/lib/auth/server";
import { visibleSettingsSections } from "../sections";
import { SettingsTabs } from "./settings-tabs";

/**
 * Shared frame for the three settings sections (screen inventory #44):
 * one page header, one tab row switching between real routes -- each tab
 * stays deep-linkable and keeps its own section's permission check. Replaces
 * the old hub-of-cards `/settings` picker.
 */
export default async function SettingsTabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const sections = visibleSettingsSections(user.role);
  if (sections.length === 0) redirect("/");

  const t = await getTranslations("pages.settings");

  return (
    <div>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <SettingsTabs
        tabs={sections.map((section) => ({
          key: section.key,
          href: section.href,
          label: t(`sections.${section.key}.title`),
        }))}
      />
      {children}
    </div>
  );
}
