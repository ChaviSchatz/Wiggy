import Link from "next/link";
import { useTranslations } from "next-intl";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MissingItemFilters } from "./missing-item-filter-bar";

export function MissingItemsPagination({
  page,
  pageSize,
  total,
  filters,
}: {
  page: number;
  pageSize: number;
  total: number;
  filters: MissingItemFilters;
}) {
  const t = useTranslations("pages.missingItems");
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  function hrefFor(targetPage: number) {
    const params = new URLSearchParams();
    if (filters.status && filters.status !== "unhandled") {
      params.set("status", filters.status);
    }
    if (filters.kind) params.set("kind", filters.kind);
    if (filters.responsible) params.set("responsible", filters.responsible);
    if (targetPage > 1) params.set("page", String(targetPage));
    const query = params.toString();
    return query ? `/missing-items?${query}` : "/missing-items";
  }

  const linkClass = cn(buttonVariants({ variant: "outline", size: "sm" }));
  const disabledClass = cn(linkClass, "pointer-events-none opacity-50");

  return (
    <div className="flex items-center justify-between pt-4 text-sm text-muted">
      <span>{t("pageOf", { page, totalPages })}</span>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link href={hrefFor(page - 1)} className={linkClass}>
            {t("previous")}
          </Link>
        ) : (
          <span className={disabledClass}>{t("previous")}</span>
        )}
        {page < totalPages ? (
          <Link href={hrefFor(page + 1)} className={linkClass}>
            {t("next")}
          </Link>
        ) : (
          <span className={disabledClass}>{t("next")}</span>
        )}
      </div>
    </div>
  );
}
