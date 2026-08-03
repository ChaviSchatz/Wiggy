import { useTranslations } from "next-intl";

import { PlaceholderPage } from "@/components/layout/placeholder-page";

export default function MyWorkPage() {
  const t = useTranslations("pages.myWork");
  return <PlaceholderPage title={t("title")} />;
}
