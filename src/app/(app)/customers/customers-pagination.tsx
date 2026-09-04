import { useTranslations } from "next-intl";

import { Pagination } from "@/components/ui/pagination";

export function CustomersPagination({
  page,
  pageSize,
  total,
  search,
}: {
  page: number;
  pageSize: number;
  total: number;
  search: string;
}) {
  const t = useTranslations("pages.customers");
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function hrefFor(targetPage: number) {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (targetPage > 1) params.set("page", String(targetPage));
    const query = params.toString();
    return query ? `/customers?${query}` : "/customers";
  }

  return (
    <Pagination
      page={page}
      pageCount={totalPages}
      hrefFor={hrefFor}
      previousLabel={t("previous")}
      nextLabel={t("next")}
    />
  );
}
