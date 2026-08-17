import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Tables } from "@/lib/supabase/database.types";

/**
 * Warnings / missing section (docs/ui/work-order-hub.md). Read-only here by
 * design: handling an item is a list-side job (screen inventory #29/#30), so
 * this section states the problem and links whoever may act on it to the
 * filtered list rather than duplicating the handle dialog. Renders nothing
 * when there are none.
 */
export function WarningsSection({
  missingItems,
  canManageMissingItems,
}: {
  missingItems: Tables<"missing_items">[];
  canManageMissingItems: boolean;
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
        {canManageMissingItems ? (
          <Link
            href="/missing-items"
            className="mt-3 inline-block text-sm text-mauve-600 hover:underline"
          >
            {t("manageLink")}
          </Link>
        ) : null}
      </CardContent>
    </Card>
  );
}
