import { useTranslations } from "next-intl";

import { PlaceholderPage } from "@/components/layout/placeholder-page";

export default function ApprovalsPage() {
  const t = useTranslations("pages.approvals");
  return <PlaceholderPage title={t("title")} />;
}
