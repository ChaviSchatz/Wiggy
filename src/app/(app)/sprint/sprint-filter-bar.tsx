"use client";

import { useTranslations } from "next-intl";

import { StaffFilterSelect } from "@/components/domain/staff-filter-select";
import { TaskStatusFilterSelect } from "@/components/domain/task-status-filter-select";
import { TaskTypeFilterSelect } from "@/components/domain/task-type-filter-select";
import type { AssignableStaffMember } from "@/lib/board/queries";

export type SprintFilters = {
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
 * Stage isn't a separate filter here (dropped -- with each task type mapped
 * to exactly one stage, it duplicated the type filter). Status, type, and
 * employee stay visually distinct from each other: status reads as a status
 * (icon badge, same language as the task's own StatusChip), type as a stage
 * identity (dot), employee as a person (avatar) -- see their own components.
 */
export function SprintFilterBar({
  filters,
  onChange,
  staff,
  taskTypeOptions,
}: {
  filters: SprintFilters;
  onChange: (filters: SprintFilters) => void;
  staff: AssignableStaffMember[];
  taskTypeOptions: { id: string; name: string; stageIndex: number }[];
}) {
  const t = useTranslations("pages.sprint.filters");
  const tTaskStatus = useTranslations("pages.orders.taskStatus");

  return (
    <div className="mb-4 flex flex-wrap gap-3">
      <StaffFilterSelect
        ariaLabel={t("employeeLabel")}
        value={filters.staffId}
        onChange={(staffId) => onChange({ ...filters, staffId })}
        staff={staff}
        allLabel={t("employeeAll")}
      />

      <TaskTypeFilterSelect
        ariaLabel={t("typeLabel")}
        value={filters.taskTypeId}
        onChange={(taskTypeId) => onChange({ ...filters, taskTypeId })}
        taskTypes={taskTypeOptions}
        allLabel={t("typeAll")}
        className="w-auto min-w-36"
      />

      <TaskStatusFilterSelect
        ariaLabel={t("statusLabel")}
        value={filters.status}
        onChange={(status) => onChange({ ...filters, status })}
        statuses={FILTERABLE_STATUSES}
        getLabel={tTaskStatus}
        allLabel={t("statusAll")}
      />
    </div>
  );
}
