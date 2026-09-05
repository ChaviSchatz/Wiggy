"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CalendarClock, Search } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  statusVariant,
  STATUS_DOT_CLASS,
} from "@/components/domain/status-chip";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { WorkOrderSort } from "@/lib/work-orders/queries";

const DEBOUNCE_MS = 300;
const STATUSES = [
  "confirmed",
  "active",
  "ready_for_handoff",
  "completed",
  "on_hold",
  "cancelled",
] as const;
const ALL_STATUS = "__all__";
const SORTS: WorkOrderSort[] = ["recent", "urgency", "due", "status"];

export function OrderFilters({
  defaultSearch,
  defaultStatus,
  defaultPriority,
  defaultDueSoon,
  defaultSort,
}: {
  defaultSearch: string;
  defaultStatus: string;
  defaultPriority: string;
  defaultDueSoon: boolean;
  defaultSort: WorkOrderSort;
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

  function updateParams(next: {
    q?: string;
    status?: string;
    priority?: string;
    dueSoon?: boolean;
    sort?: string;
  }) {
    const params = new URLSearchParams(searchParams.toString());
    const setOrDelete = (key: string, value: string | undefined) => {
      if (value) params.set(key, value);
      else params.delete(key);
    };
    if (next.q !== undefined) setOrDelete("q", next.q.trim() || undefined);
    if (next.status !== undefined) setOrDelete("status", next.status);
    if (next.priority !== undefined) setOrDelete("priority", next.priority);
    if (next.dueSoon !== undefined) {
      setOrDelete("dueSoon", next.dueSoon ? "true" : undefined);
    }
    if (next.sort !== undefined) {
      setOrDelete("sort", next.sort === "recent" ? undefined : next.sort);
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
    <div className="flex flex-wrap items-center gap-2">
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

      <Select
        value={defaultStatus || ALL_STATUS}
        onValueChange={(value) =>
          updateParams({ status: value === ALL_STATUS ? "" : value })
        }
      >
        <SelectTrigger
          aria-label={t("statusFilterLabel")}
          className="w-auto min-w-36"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_STATUS}>{t("statusFilterAll")}</SelectItem>
          {STATUSES.map((status) => (
            <SelectItem key={status} value={status}>
              <StatusDot status={status} />
              {t(`status.${status}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <FilterToggle
        active={defaultPriority === "urgent"}
        onClick={() =>
          updateParams({
            priority: defaultPriority === "urgent" ? "" : "urgent",
          })
        }
        icon={<AlertTriangle className="size-3.5" aria-hidden />}
        tone="danger"
        label={t("urgentOnly")}
      />

      <FilterToggle
        active={defaultDueSoon}
        onClick={() => updateParams({ dueSoon: !defaultDueSoon })}
        icon={<CalendarClock className="size-3.5" aria-hidden />}
        tone="warning"
        label={t("dueSoonOnly")}
      />

      <Select
        value={defaultSort}
        onValueChange={(value) => updateParams({ sort: value })}
      >
        <SelectTrigger aria-label={t("sortLabel")} className="w-auto min-w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SORTS.map((sort) => (
            <SelectItem key={sort} value={sort}>
              {t(`sort.${sort}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function StatusDot({ status }: { status: (typeof STATUSES)[number] }) {
  const variant = statusVariant("order", status) ?? "neutral";
  return (
    <span
      className={cn("size-[6px] shrink-0 rounded-full", STATUS_DOT_CLASS[variant])}
      aria-hidden="true"
    />
  );
}

function FilterToggle({
  active,
  onClick,
  icon,
  label,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  tone: "danger" | "warning";
}) {
  const toneClass =
    tone === "danger"
      ? "border-danger-200 bg-danger-100 text-danger-600"
      : "border-peach-200 bg-peach-100 text-peach-600";

  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex h-[39px] items-center gap-1.5 rounded-xs border px-3 text-body font-medium transition-colors",
        active
          ? toneClass
          : "border-line-strong bg-surface text-muted hover:bg-mauve-100/50",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
