import { useTranslations } from "next-intl";

import { PlaceholderPage } from "@/components/layout/placeholder-page";

export default function CustomersPage() {
  const t = useTranslations("pages.customers");
  return <PlaceholderPage title={t("title")} />;
}
