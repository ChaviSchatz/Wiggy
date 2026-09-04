"use client";

import { useTranslations } from "next-intl";

import { StaffFilterSelect } from "@/components/domain/staff-filter-select";
import type { AssignableStaffMember } from "@/lib/board/queries";
import type { Tables } from "@/lib/supabase/database.types";

export type SprintFilters = {
  stageId: string;
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

export function SprintFilterBar({
  filters,
  onChange,
  stages,
  staff,
  taskTypeOptions,
}: {
  filters: SprintFilters;
  onChange: (filters: SprintFilters) => void;
  stages: Tables<"work_stages">[];
  staff: AssignableStaffMember[];
  taskTypeOptions: { id: string; name: string }[];
}) {
  const t = useTranslations("pages.sprint.filters");
  const tTaskStatus = useTranslations("pages.orders.taskStatus");

  const selectClass =
    "h-10 rounded-control border border-line bg-surface px-3 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div className="mb-4 flex flex-wrap gap-3">
      <select
        aria-label={t("stageLabel")}
        value={filters.stageId}
        onChange={(event) =>
          onChange({ ...filters, stageId: event.target.value })
        }
        className={selectClass}
      >
        <option value="">{t("stageAll")}</option>
        {stages.map((stage) => (
          <option key={stage.id} value={stage.id}>
            {stage.name}
          </option>
        ))}
      </select>

      <StaffFilterSelect
        ariaLabel={t("employeeLabel")}
        value={filters.staffId}
        onChange={(staffId) => onChange({ ...filters, staffId })}
        staff={staff}
        allLabel={t("employeeAll")}
      />

      <select
        aria-label={t("typeLabel")}
        value={filters.taskTypeId}
        onChange={(event) =>
          onChange({ ...filters, taskTypeId: event.target.value })
        }
        className={selectClass}
      >
        <option value="">{t("typeAll")}</option>
        {taskTypeOptions.map((taskType) => (
          <option key={taskType.id} value={taskType.id}>
            {taskType.name}
          </option>
        ))}
      </select>

      <select
        aria-label={t("statusLabel")}
        value={filters.status}
        onChange={(event) =>
          onChange({ ...filters, status: event.target.value })
        }
        className={selectClass}
      >
        <option value="">{t("statusAll")}</option>
        {FILTERABLE_STATUSES.map((status) => (
          <option key={status} value={status}>
            {tTaskStatus(status)}
          </option>
        ))}
      </select>
    </div>
  );
}
