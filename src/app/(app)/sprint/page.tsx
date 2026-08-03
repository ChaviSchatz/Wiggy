import { useTranslations } from "next-intl";

import { PlaceholderPage } from "@/components/layout/placeholder-page";

export default function SprintPage() {
  const t = useTranslations("pages.sprint");
  return <PlaceholderPage title={t("title")} />;
}
