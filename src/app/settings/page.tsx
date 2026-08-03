import { useTranslations } from "next-intl";

import { PlaceholderPage } from "@/components/layout/placeholder-page";

export default function SettingsPage() {
  const t = useTranslations("pages.settings");
  return <PlaceholderPage title={t("title")} />;
}
