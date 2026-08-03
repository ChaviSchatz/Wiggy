import { useTranslations } from "next-intl";

import { PlaceholderPage } from "@/components/layout/placeholder-page";

export default function BoardPage() {
  const t = useTranslations("pages.board");
  return <PlaceholderPage title={t("title")} />;
}
