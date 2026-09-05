import Link from "next/link";
import { useTranslations } from "next-intl";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function OrdersPagination({
  page,
  pageSize,
  total,
  search,
  status,
  priority,
  dueSoon,
  sort,
}: {
  page: number;
  pageSize: number;
  total: number;
  search: string;
  status: string;
  priority?: string;
  dueSoon?: boolean;
  sort?: string;
}) {
  const t = useTranslations("pages.orders");
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  function hrefFor(targetPage: number) {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (status) params.set("status", status);
    if (priority) params.set("priority", priority);
    if (dueSoon) params.set("dueSoon", "true");
    if (sort && sort !== "recent") params.set("sort", sort);
    if (targetPage > 1) params.set("page", String(targetPage));
    const query = params.toString();
    return query ? `/orders?${query}` : "/orders";
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
