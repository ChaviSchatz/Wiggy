"use client";

import { useTranslations } from "next-intl";

import { StaffFilterSelect } from "@/components/domain/staff-filter-select";
import { TaskTypeFilterSelect } from "@/components/domain/task-type-filter-select";
import type { AssignableStaffMember } from "@/lib/board/queries";
import { cn } from "@/lib/utils";

export type BoardFilters = {
  staffId: string;
  taskTypeId: string;
  status: string;
};

const FILTERABLE_STATUSES = [
  "pending",
  "in_progress",
  "awaiting_approval",
  "returned_for_rework",
  "deferred",
] as const;

/**
 * The shared list/board filter row (design-system.md §4). Status is the
 * high-frequency scope, so it reads as underline tabs; worker and task type are
 * data-driven with unbounded options, so they stay selects.
 */
export function BoardFilterBar({
  filters,
  onChange,
  staff,
  taskTypeOptions,
}: {
  filters: BoardFilters;
  onChange: (filters: BoardFilters) => void;
  staff: AssignableStaffMember[];
  taskTypeOptions: { id: string; name: string; stageIndex: number }[];
}) {
  const t = useTranslations("pages.board.filters");
  const tLegend = useTranslations("pages.board.legend");
  const tTaskStatus = useTranslations("pages.orders.taskStatus");

  const tabClass = (active: boolean) =>
    cn(
      "-mb-px border-b-2 px-1 pb-2 text-body font-medium transition-colors",
      active
        ? "border-mauve-600 text-mauve-600"
        : "border-transparent text-muted hover:text-ink",
    );

  return (
    <div className="mb-4 space-y-3">
      <div
        role="tablist"
        aria-label={t("statusLabel")}
        className="flex flex-wrap items-center gap-4 border-b border-line"
      >
        <button
          type="button"
          role="tab"
          aria-selected={filters.status === ""}
          onClick={() => onChange({ ...filters, status: "" })}
          className={tabClass(filters.status === "")}
        >
          {t("statusAll")}
        </button>
        {FILTERABLE_STATUSES.map((status) => (
          <button
            key={status}
            type="button"
            role="tab"
            aria-selected={filters.status === status}
            onClick={() => onChange({ ...filters, status })}
            className={tabClass(filters.status === status)}
          >
            {tTaskStatus(status)}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <StaffFilterSelect
          ariaLabel={t("employeeLabel")}
          value={filters.staffId}
          onChange={(staffId) => onChange({ ...filters, staffId })}
          staff={staff}
          allLabel={t("employeeAll")}
          unassignedLabel={t("unassigned")}
        />

        <TaskTypeFilterSelect
          ariaLabel={t("typeLabel")}
          value={filters.taskTypeId}
          onChange={(taskTypeId) => onChange({ ...filters, taskTypeId })}
          taskTypes={taskTypeOptions}
          allLabel={t("typeAll")}
          className="w-auto min-w-36"
        />

        {/*
          Three urgency states, not four (ADR 0012). "Normal" has no mark on the
          card, so the legend explains its absence rather than inventing a chip.
        */}
        <div className="ms-auto flex items-center gap-3 text-meta text-muted">
          <span className="font-medium">{tLegend("title")}</span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-danger-500" aria-hidden />
            {tLegend("urgent")}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-idle-500" aria-hidden />
            {tLegend("blocked")}
          </span>
        </div>
      </div>
    </div>
  );
}
