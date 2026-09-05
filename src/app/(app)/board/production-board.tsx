"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { KanbanColumn } from "@/components/domain/kanban-column";
import { ReturnForReworkDialog } from "@/components/tasks/return-for-rework-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { UndoToast } from "@/components/ui/undo-toast";
import { computeAvailability, type TaskStatus } from "@/lib/availability";
import {
  approveTaskAction,
  completeTaskAction,
  setAvailabilityOverrideAction,
  startTaskAction,
  undoCompleteTaskAction,
  undoStartTaskAction,
} from "@/lib/board/actions";
import type { AssignableStaffMember, BoardTask } from "@/lib/board/queries";
import type { Tables } from "@/lib/supabase/database.types";
import { AssigneePickerDialog } from "./assignee-picker-dialog";
import { BoardFilterBar, type BoardFilters } from "./board-filter-bar";
import { TaskCard } from "./task-card";
import { TaskPeekSheet } from "./task-peek-sheet";

type WorkStage = Tables<"work_stages">;

const UNDO_WINDOW_MS = 6000;

type UndoEntry = {
  kind: "start" | "complete";
  previousTask: BoardTask;
};

export function ProductionBoard({
  stages,
  initialTasks,
  staff,
  canManageBoard,
  canApprove,
}: {
  stages: WorkStage[];
  initialTasks: BoardTask[];
  staff: AssignableStaffMember[];
  canManageBoard: boolean;
  canApprove: boolean;
}) {
  const t = useTranslations("pages.board");

  const [tasks, setTasks] = useState(initialTasks);
  const [filters, setFilters] = useState<BoardFilters>({
    staffId: "",
    taskTypeId: "",
    status: "",
    urgentOnly: false,
    dueBy: "",
  });
  const [peekTask, setPeekTask] = useState<BoardTask | null>(null);
  const [assigneeTask, setAssigneeTask] = useState<BoardTask | null>(null);
  const [returnTaskId, setReturnTaskId] = useState<string | null>(null);
  const [undo, setUndo] = useState<{ taskId: string; entry: UndoEntry } | null>(
    null,
  );
  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    return () => {
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    };
  }, []);

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
    const seen = new Map<string, { name: string; stageIndex: number }>();
    for (const task of tasks) {
      if (task.task_type_id && task.taskTypeName) {
        const stageIndex = stages.findIndex(
          (stage) => stage.id === task.work_stage_id,
        );
        seen.set(task.task_type_id, {
          name: task.taskTypeName,
          stageIndex: Math.max(stageIndex, 0),
        });
      }
    }
    return Array.from(seen.entries()).map(([id, { name, stageIndex }]) => ({
      id,
      name,
      stageIndex,
    }));
  }, [tasks, stages]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filters.staffId === "unassigned" && task.assigned_staff_member_id)
        return false;
      if (
        filters.staffId &&
        filters.staffId !== "unassigned" &&
        task.assigned_staff_member_id !== filters.staffId
      ) {
        return false;
      }
      if (filters.taskTypeId && task.task_type_id !== filters.taskTypeId)
        return false;
      if (filters.status && task.status !== filters.status) return false;
      if (filters.urgentOnly && !task.priority) return false;
      if (filters.dueBy) {
        // The task's own due date wins; the order's is the fallback -- same
        // rule TaskCard uses to decide what date a card is showing (ADR 0012).
        const dueAt = task.due_at ?? task.orderDueAt;
        if (!dueAt) return false;
        const cutoff = new Date(`${filters.dueBy}T23:59:59.999`);
        if (new Date(dueAt).getTime() > cutoff.getTime()) return false;
      }
      return true;
    });
  }, [tasks, filters]);

  const tasksByStage = useMemo(() => {
    const map = new Map<string, BoardTask[]>();
    for (const task of filteredTasks) {
      const list = map.get(task.work_stage_id) ?? [];
      list.push(task);
      map.set(task.work_stage_id, list);
    }
    return map;
  }, [filteredTasks]);

  function updateTask(taskId: string, patch: Partial<BoardTask>) {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...patch } : t)),
    );
  }

  function replaceTask(task: BoardTask) {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
  }

  function armUndo(taskId: string, entry: UndoEntry) {
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    setUndo({ taskId, entry });
    undoTimeoutRef.current = setTimeout(() => setUndo(null), UNDO_WINDOW_MS);
  }

  async function handleStart(task: BoardTask) {
    const previousTask = task;
    updateTask(task.id, {
      status: "in_progress",
      started_at: new Date().toISOString(),
    });

    const result = await startTaskAction(task.id);
    if (!result.success) {
      replaceTask(previousTask);
      return;
    }
    armUndo(task.id, { kind: "start", previousTask });
  }

  async function handleComplete(task: BoardTask) {
    const previousTask = task;
    const nextStatus = task.requires_approval ? "awaiting_approval" : "done";
    updateTask(task.id, {
      status: nextStatus,
      completed_at: nextStatus === "done" ? new Date().toISOString() : null,
    });

    const result = await completeTaskAction(task.id);
    if (!result.success) {
      replaceTask(previousTask);
      return;
    }
    armUndo(task.id, { kind: "complete", previousTask });
  }

  async function handleUndo() {
    if (!undo) return;
    const { taskId, entry } = undo;
    setUndo(null);
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);

    const result =
      entry.kind === "start"
        ? await undoStartTaskAction(taskId)
        : await undoCompleteTaskAction(taskId);
    if (result.success) {
      replaceTask(entry.previousTask);
    }
  }

  async function handleToggleOverride(task: BoardTask) {
    updateTask(task.id, { availability_override: true });
    const result = await setAvailabilityOverrideAction(task.id, true);
    if (!result.success) {
      updateTask(task.id, { availability_override: false });
    }
  }

  async function handleApprove(task: BoardTask) {
    const previousTask = task;
    updateTask(task.id, {
      status: "done",
      completed_at: new Date().toISOString(),
    });
    const result = await approveTaskAction(task.id);
    if (!result.success) {
      replaceTask(previousTask);
    }
  }

  return (
    <div>
      <BoardFilterBar
        filters={filters}
        onChange={setFilters}
        staff={staff}
        taskTypeOptions={taskTypeOptions}
      />

      {filteredTasks.length === 0 ? (
        <EmptyState
          title={t("emptyTitle")}
          description={t("emptyDescription")}
        />
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {stages.map((stage, index) => {
            const stageTasks = tasksByStage.get(stage.id) ?? [];
            return (
              <KanbanColumn
                key={stage.id}
                title={stage.name}
                count={stageTasks.length}
                emptyLabel={t("columnEmpty")}
                index={index}
              >
                {stageTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    availability={
                      availabilityByTaskId.get(task.id) ?? "available"
                    }
                    canManageBoard={canManageBoard}
                    canApprove={canApprove}
                    onOpenPeek={() => setPeekTask(task)}
                    onOpenAssignee={() => setAssigneeTask(task)}
                    onStart={() => handleStart(task)}
                    onComplete={() => handleComplete(task)}
                    onToggleOverride={() => handleToggleOverride(task)}
                    onApprove={() => handleApprove(task)}
                    onReturn={() => setReturnTaskId(task.id)}
                  />
                ))}
              </KanbanColumn>
            );
          })}
        </div>
      )}

      <TaskPeekSheet
        task={peekTask}
        availability={
          peekTask ? availabilityByTaskId.get(peekTask.id) : undefined
        }
        onOpenChange={(open) => !open && setPeekTask(null)}
        onStart={(task) => {
          handleStart(task);
          setPeekTask(null);
        }}
        onComplete={(task) => {
          handleComplete(task);
          setPeekTask(null);
        }}
      />

      <AssigneePickerDialog
        task={assigneeTask}
        staff={staff}
        onOpenChange={(open) => !open && setAssigneeTask(null)}
        onReassigned={(taskId, staffMemberId, staffName) => {
          updateTask(taskId, {
            assigned_staff_member_id: staffMemberId,
            assignedStaffMemberName: staffName,
          });
        }}
      />

      <ReturnForReworkDialog
        taskId={returnTaskId}
        open={returnTaskId !== null}
        onOpenChange={(open) => !open && setReturnTaskId(null)}
      />

      {undo ? (
        <UndoToast
          message={t(
            undo.entry.kind === "start"
              ? "undoStartMessage"
              : "undoCompleteMessage",
          )}
          actionLabel={t("undo")}
          onUndo={handleUndo}
        />
      ) : null}
    </div>
  );
}
