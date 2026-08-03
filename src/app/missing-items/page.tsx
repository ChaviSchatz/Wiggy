import { useTranslations } from "next-intl";

import { PlaceholderPage } from "@/components/layout/placeholder-page";

export default function MissingItemsPage() {
  const t = useTranslations("pages.missingItems");
  return <PlaceholderPage title={t("title")} />;
}
