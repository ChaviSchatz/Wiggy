"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import type { AssignableStaffMember } from "@/lib/board/queries";
import {
  MISSING_ITEM_KINDS,
  MISSING_ITEM_STATUSES,
} from "@/lib/missing-items/validation";

export type MissingItemFilters = {
  /** A status, `unhandled` (the default) or `all`. */
  status: string;
  kind: string;
  responsible: string;
};

/**
 * Filter by kind / status / responsible (screen inventory #29). Filters live
 * in the URL so the list stays server-rendered and shareable, matching the
 * customers list's search bar.
 */
export function MissingItemFilterBar({
  filters,
  staff,
}: {
  filters: MissingItemFilters;
  staff: AssignableStaffMember[];
}) {
  const t = useTranslations("pages.missingItems.filters");
  const tStatus = useTranslations("pages.missingItems.status");
  const tKind = useTranslations("pages.missingItems.kind");
  const router = useRouter();

  const selectClass =
    "h-10 rounded-control border border-line bg-surface px-3 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  function apply(next: Partial<MissingItemFilters>) {
    const merged = { ...filters, ...next };
    const params = new URLSearchParams();
    if (merged.status && merged.status !== "unhandled") {
      params.set("status", merged.status);
    }
    if (merged.kind) params.set("kind", merged.kind);
    if (merged.responsible) params.set("responsible", merged.responsible);
    const query = params.toString();
    router.push(query ? `/missing-items?${query}` : "/missing-items");
  }

  return (
    <div className="flex flex-wrap gap-3">
      <select
        aria-label={t("statusLabel")}
        value={filters.status}
        onChange={(event) => apply({ status: event.target.value })}
        className={selectClass}
      >
        <option value="unhandled">{t("statusUnhandled")}</option>
        <option value="all">{t("statusAll")}</option>
        {MISSING_ITEM_STATUSES.map((status) => (
          <option key={status} value={status}>
            {tStatus(status)}
          </option>
        ))}
      </select>

      <select
        aria-label={t("kindLabel")}
        value={filters.kind}
        onChange={(event) => apply({ kind: event.target.value })}
        className={selectClass}
      >
        <option value="">{t("kindAll")}</option>
        {MISSING_ITEM_KINDS.map((kind) => (
          <option key={kind} value={kind}>
            {tKind(kind)}
          </option>
        ))}
      </select>

      <select
        aria-label={t("responsibleLabel")}
        value={filters.responsible}
        onChange={(event) => apply({ responsible: event.target.value })}
        className={selectClass}
      >
        <option value="">{t("responsibleAll")}</option>
        {staff.map((member) => (
          <option key={member.id} value={member.id}>
            {member.full_name}
          </option>
        ))}
      </select>
    </div>
  );
}
