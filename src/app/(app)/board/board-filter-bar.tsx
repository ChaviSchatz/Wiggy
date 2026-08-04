"use client";

import { useTranslations } from "next-intl";

import type { AssignableStaffMember } from "@/lib/board/queries";

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

export function BoardFilterBar({
  filters,
  onChange,
  staff,
  taskTypeOptions,
}: {
  filters: BoardFilters;
  onChange: (filters: BoardFilters) => void;
  staff: AssignableStaffMember[];
  taskTypeOptions: { id: string; name: string }[];
}) {
  const t = useTranslations("pages.board.filters");
  const tTaskStatus = useTranslations("pages.orders.taskStatus");

  const selectClass =
    "h-10 rounded-control border border-line bg-surface px-3 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div className="mb-4 flex flex-wrap gap-3">
      <select
        aria-label={t("employeeLabel")}
        value={filters.staffId}
        onChange={(event) =>
          onChange({ ...filters, staffId: event.target.value })
        }
        className={selectClass}
      >
        <option value="">{t("employeeAll")}</option>
        <option value="unassigned">{t("unassigned")}</option>
        {staff.map((member) => (
          <option key={member.id} value={member.id}>
            {member.full_name}
          </option>
        ))}
      </select>

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
