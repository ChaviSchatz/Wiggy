"use client";

import { useTranslations } from "next-intl";

import { STAGE_DOT_CLASSES } from "@/components/domain/kanban-column";
import { StaffFilterSelect } from "@/components/domain/staff-filter-select";
import {
  statusVariant,
  STATUS_DOT_CLASS,
} from "@/components/domain/status-chip";
import { TaskTypeFilterSelect } from "@/components/domain/task-type-filter-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AssignableStaffMember } from "@/lib/board/queries";
import type { Tables } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";

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
  taskTypeOptions: { id: string; name: string; stageIndex: number }[];
}) {
  const t = useTranslations("pages.sprint.filters");
  const tTaskStatus = useTranslations("pages.orders.taskStatus");

  return (
    <div className="mb-4 flex flex-wrap gap-3">
      <Select
        value={filters.stageId || STAGE_ALL}
        onValueChange={(value) =>
          onChange({ ...filters, stageId: value === STAGE_ALL ? "" : value })
        }
      >
        <SelectTrigger aria-label={t("stageLabel")} className="w-auto min-w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={STAGE_ALL}>{t("stageAll")}</SelectItem>
          {stages.map((stage, index) => (
            <SelectItem key={stage.id} value={stage.id}>
              <span
                className={cn(
                  "size-[8px] shrink-0 rounded-full",
                  STAGE_DOT_CLASSES[index % STAGE_DOT_CLASSES.length],
                )}
                aria-hidden="true"
              />
              <span className="truncate">{stage.name}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

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

      <Select
        value={filters.status || STATUS_ALL}
        onValueChange={(value) =>
          onChange({ ...filters, status: value === STATUS_ALL ? "" : value })
        }
      >
        <SelectTrigger aria-label={t("statusLabel")} className="w-auto min-w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={STATUS_ALL}>{t("statusAll")}</SelectItem>
          {FILTERABLE_STATUSES.map((status) => (
            <SelectItem key={status} value={status}>
              <span
                className={cn(
                  "size-[6px] shrink-0 rounded-full",
                  STATUS_DOT_CLASS[statusVariant("task", status) ?? "neutral"],
                )}
                aria-hidden="true"
              />
              {tTaskStatus(status)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

const STAGE_ALL = "__all__";
const STATUS_ALL = "__all__";
