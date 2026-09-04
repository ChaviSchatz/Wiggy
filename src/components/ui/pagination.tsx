import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface PaginationProps {
  page: number;
  pageCount: number;
  /** Builds the href for a given 1-indexed page — every list here is server-paginated via the URL. */
  hrefFor: (page: number) => string;
  previousLabel: string;
  nextLabel: string;
  /** e.g. "128 תוצאות" — rendered at the inline start. */
  totalLabel?: string;
  className?: string;
}

/** Server pagination, page size 20 (design-system.md, "data" group). */
export function Pagination({
  page,
  pageCount,
  hrefFor,
  previousLabel,
  nextLabel,
  totalLabel,
  className,
}: PaginationProps) {
  if (pageCount <= 1) return null;

  const linkClass = cn(buttonVariants({ variant: "outline", size: "sm" }));
  const disabledClass = cn(linkClass, "pointer-events-none opacity-50");

  return (
    <div className={cn("mt-3.5 flex items-center gap-3", className)}>
      {totalLabel && <span className="text-meta tabular-nums text-muted">{totalLabel}</span>}
      <div className="ms-auto flex items-center gap-2">
        {page > 1 ? (
          <Link href={hrefFor(page - 1)} className={linkClass}>
            <ChevronRight className="size-4" aria-hidden />
            {previousLabel}
          </Link>
        ) : (
          <span className={disabledClass}>
            <ChevronRight className="size-4" aria-hidden />
            {previousLabel}
          </span>
        )}
        <span className="text-meta tabular-nums text-muted">
          {page} / {pageCount}
        </span>
        {page < pageCount ? (
          <Link href={hrefFor(page + 1)} className={linkClass}>
            {nextLabel}
            <ChevronLeft className="size-4" aria-hidden />
          </Link>
        ) : (
          <span className={disabledClass}>
            {nextLabel}
            <ChevronLeft className="size-4" aria-hidden />
          </span>
        )}
      </div>
    </div>
  );
}
