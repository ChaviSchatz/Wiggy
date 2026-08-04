"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";

const DEBOUNCE_MS = 300;
const STATUSES = [
  "confirmed",
  "active",
  "ready_for_handoff",
  "completed",
  "on_hold",
  "cancelled",
] as const;

export function OrderFilters({
  defaultSearch,
  defaultStatus,
}: {
  defaultSearch: string;
  defaultStatus: string;
}) {
  const t = useTranslations("pages.orders");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(defaultSearch);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => setSearch(defaultSearch), [defaultSearch]);
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  function updateParams(next: { q?: string; status?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.q !== undefined) {
      if (next.q.trim()) params.set("q", next.q.trim());
      else params.delete("q");
    }
    if (next.status !== undefined) {
      if (next.status) params.set("status", next.status);
      else params.delete("status");
    }
    params.delete("page");
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(
      () => updateParams({ q: value }),
      DEBOUNCE_MS,
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative w-full max-w-sm">
        <Search
          className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted"
          aria-hidden
        />
        <Input
          value={search}
          onChange={(event) => handleSearchChange(event.target.value)}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchPlaceholder")}
          className="ps-9"
        />
      </div>
      <select
        value={defaultStatus}
        onChange={(event) => updateParams({ status: event.target.value })}
        aria-label={t("statusFilterLabel")}
        className="h-10 rounded-control border border-line bg-surface px-3 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="">{t("statusFilterAll")}</option>
        {STATUSES.map((status) => (
          <option key={status} value={status}>
            {t(`status.${status}`)}
          </option>
        ))}
      </select>
    </div>
  );
}
