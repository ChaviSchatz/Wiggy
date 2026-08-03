import { useTranslations } from "next-intl";

import { PlaceholderPage } from "@/components/layout/placeholder-page";

export default function OrdersPage() {
  const t = useTranslations("pages.orders");
  return <PlaceholderPage title={t("title")} />;
}
