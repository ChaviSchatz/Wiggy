import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Tables } from "@/lib/supabase/database.types";

/**
 * Warnings / missing section (docs/ui/work-order-hub.md). Read-only this
 * slice -- `missing_items` create/handle UI and intake auto-creation are
 * Slice 8; the schema/RLS landed now so the hub can already surface any
 * that exist. Renders nothing when there are none, so it never claims a
 * capability (add/handle) that doesn't exist yet.
 */
export function WarningsSection({
  missingItems,
}: {
  missingItems: Tables<"missing_items">[];
}) {
  const t = useTranslations("pages.orders.detail.hub.warnings");
  const open = missingItems.filter((item) => item.status !== "handled");
  if (open.length === 0) return null;

  return (
    <Card className="border-danger-600/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base text-danger-600">
          <AlertTriangle className="size-4" aria-hidden />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {open.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-2 text-sm">
              <span className="text-ink">
                {t(`kind.${item.kind}`)}
                {item.description ? ` — ${item.description}` : ""}
              </span>
              <Badge variant="warning">{t(`status.${item.status}`)}</Badge>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
