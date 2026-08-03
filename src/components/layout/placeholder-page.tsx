import { useTranslations } from "next-intl";

import { PageHeader } from "./page-header";

export function PlaceholderPage({ title }: { title: string }) {
  const t = useTranslations("common");

  return (
    <div>
      <PageHeader title={title} />
      <p className="text-muted">{t("comingSoon")}</p>
    </div>
  );
}
