"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { EmptyState } from "@/components/ui/empty-state";
import { computeAvailability, type TaskStatus } from "@/lib/availability";
import type { AssignableStaffMember, BoardTask } from "@/lib/board/queries";
import {
  assignTaskToEmployeeAction,
  moveTaskInQueueAction,
  toggleTaskPriorityAction,
} from "@/lib/sprints/actions";
import type { Sprint } from "@/lib/sprints/queries";
import type { Tables } from "@/lib/supabase/database.types";
import { SprintFilterBar, type SprintFilters } from "./sprint-filter-bar";
import { SprintHeader } from "./sprint-header";
import { SprintTaskCard } from "./sprint-task-card";

type WorkStage = Tables<"work_stages">;

function byQueueRank(a: BoardTask, b: BoardTask): number {
  return (a.queue_rank ?? 0) - (b.queue_rank ?? 0);
}

export function SprintPlanningBoard({
  sprint,
  cadenceDays,
  initialTasks,
  staff,
  stages,
}: {
  sprint: Sprint | null;
  cadenceDays: number;
  initialTasks: BoardTask[];
  staff: AssignableStaffMember[];
  stages: WorkStage[];
}) {
  const t = useTranslations("pages.sprint");
  const router = useRouter();

  const [tasks, setTasks] = useState(initialTasks);
  const [filters, setFilters] = useState<SprintFilters>({
    stageId: "",
    staffId: "",
    taskTypeId: "",
    status: "",
  });

  const availabilityByTaskId = useMemo(
    () =>
      computeAvailability(
        tasks.map((task) => ({
          id: task.id,
          workOrderId: task.work_order_id,
          sequenceOrder: task.sequence_order,
          status: task.status as TaskStatus,
          availabilityOverride: task.availability_override,
        })),
      ),
    [tasks],
  );

  const taskTypeOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const task of tasks) {
      if (task.task_type_id && task.taskTypeName)
        seen.set(task.task_type_id, task.taskTypeName);
    }
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filters.stageId && task.work_stage_id !== filters.stageId) return false;
      if (filters.taskTypeId && task.task_type_id !== filters.taskTypeId) return false;
      if (filters.status && task.status !== filters.status) return false;
      return true;
    });
  }, [tasks, filters]);

  const backlogTasks = filteredTasks.filter((task) => !task.assigned_staff_member_id);
  const visibleStaff = filters.staffId
    ? staff.filter((member) => member.id === filters.staffId)
    : staff;

  function updateTask(taskId: string, patch: Partial<BoardTask>) {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...patch } : t)));
  }

  async function handleAssign(task: BoardTask, staffMemberId: string | null) {
    const previous = task;
    updateTask(task.id, { assigned_staff_member_id: staffMemberId });
    const result = await assignTaskToEmployeeAction(
      task.id,
      staffMemberId,
      sprint?.id ?? null,
    );
    if (!result.success) {
      updateTask(task.id, previous);
      return;
    }
    router.refresh();
  }

  async function handleMove(task: BoardTask, direction: "up" | "down") {
    const result = await moveTaskInQueueAction(task.id, direction);
    if (result.success) router.refresh();
  }

  async function handleTogglePriority(task: BoardTask) {
    const nextPriority = !task.priority;
    updateTask(task.id, { priority: nextPriority });
    const result = await toggleTaskPriorityAction(task.id, nextPriority);
    if (!result.success) updateTask(task.id, { priority: task.priority });
  }

  return (
    <div>
      <SprintHeader sprint={sprint} cadenceDays={cadenceDays} openTaskCount={tasks.length} />
      <SprintFilterBar
        filters={filters}
        onChange={setFilters}
        stages={stages}
        staff={staff}
        taskTypeOptions={taskTypeOptions}
      />

      {filteredTasks.length === 0 ? (
        <EmptyState title={t("emptyTitle")} description={t("emptyDescription")} />
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          <div className="w-72 shrink-0">
            <div className="mb-2 flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold text-ink">{t("backlogTitle")}</h2>
              <span className="text-xs text-muted">{backlogTasks.length}</span>
            </div>
            <div className="space-y-2">
              {backlogTasks.map((task) => (
                <SprintTaskCard
                  key={task.id}
                  task={task}
                  availability={availabilityByTaskId.get(task.id) ?? "available"}
                  staff={staff}
                  canMoveUp={false}
                  canMoveDown={false}
                  onAssign={(staffMemberId) => handleAssign(task, staffMemberId)}
                  onMove={() => undefined}
                  onTogglePriority={() => handleTogglePriority(task)}
                />
              ))}
            </div>
          </div>

          {visibleStaff.map((member) => {
            const laneTasks = filteredTasks
              .filter((task) => task.assigned_staff_member_id === member.id)
              .sort(byQueueRank);
            return (
              <div key={member.id} className="w-72 shrink-0">
                <div className="mb-2 flex items-center justify-between px-1">
                  <h2 className="text-sm font-semibold text-ink">{member.full_name}</h2>
                  <span className="text-xs text-muted">{laneTasks.length}</span>
                </div>
                <div className="space-y-2">
                  {laneTasks.map((task, index) => (
                    <SprintTaskCard
                      key={task.id}
                      task={task}
                      rank={index + 1}
                      availability={availabilityByTaskId.get(task.id) ?? "available"}
                      staff={staff}
                      canMoveUp={index > 0}
                      canMoveDown={index < laneTasks.length - 1}
                      onAssign={(staffMemberId) => handleAssign(task, staffMemberId)}
                      onMove={(direction) => handleMove(task, direction)}
                      onTogglePriority={() => handleTogglePriority(task)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
