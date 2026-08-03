import { useTranslations } from "next-intl";

import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DashboardPage() {
  const t = useTranslations("pages.dashboard");

  const cards = [
    {
      title: t("openOrders.title"),
      description: t("openOrders.description"),
    },
    {
      title: t("dueThisWeek.title"),
      description: t("dueThisWeek.description"),
    },
  ];

  return (
    <div>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader>
              <CardTitle>{card.title}</CardTitle>
              <CardDescription>{card.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
