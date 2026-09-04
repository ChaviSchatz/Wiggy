"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { StatusChip } from "@/components/domain/status-chip";
import { DeferTaskDialog } from "@/components/tasks/defer-task-dialog";
import { ReturnForReworkDialog } from "@/components/tasks/return-for-rework-dialog";
import { computeAvailability, type TaskStatus } from "@/lib/availability";
import {
  approveTaskAction,
  completeTaskAction,
  reassignTaskAction,
  resumeTaskAction,
  setAvailabilityOverrideAction,
  startTaskAction,
} from "@/lib/board/actions";
import type { HubData, HubTask } from "@/lib/work-orders/hub-queries";
import { AddTaskDialog } from "./task-dialogs";

const STARTABLE = new Set<TaskStatus>(["pending", "returned_for_rework"]);
const DEFERRABLE = new Set<TaskStatus>(["pending", "in_progress"]);
const TERMINAL = new Set<TaskStatus>(["done", "skipped", "cancelled"]);

export function TaskSection({
  workOrderId,
  tasks,
  workStages,
  staff,
  taskTypes,
  canWorkTasks,
  canApprove,
  canManageBoard,
  canManageOrder,
}: {
  workOrderId: string;
  tasks: HubTask[];
  workStages: HubData["workStages"];
  staff: HubData["staff"];
  taskTypes: HubData["taskTypes"];
  canWorkTasks: boolean;
  canApprove: boolean;
  canManageBoard: boolean;
  canManageOrder: boolean;
}) {
  const t = useTranslations("pages.orders.detail.hub.tasks");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [returnTaskId, setReturnTaskId] = useState<string | null>(null);
  const [deferTaskId, setDeferTaskId] = useState<string | null>(null);
  const [addTaskOpen, setAddTaskOpen] = useState(false);

  const availability = useMemo(
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

  const nextActionTasks = tasks.filter(
    (task) =>
      availability.get(task.id) === "available" &&
      (task.status === "pending" ||
        task.status === "returned_for_rework" ||
        task.status === "in_progress"),
  );

  function run(action: () => Promise<{ success: boolean }>) {
    startTransition(async () => {
      await action();
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {nextActionTasks.length > 0 && canWorkTasks ? (
        <Panel title={t("nextActionTitle")} className="border-transparent bg-cream" bodyClassName="space-y-2">
          {nextActionTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between gap-3 rounded-control bg-surface p-3"
            >
              <div>
                <p className="text-sm font-medium text-ink">{task.title}</p>
                <p className="text-xs text-muted">{task.workStageName}</p>
              </div>
              {task.status === "in_progress" ? (
                <Button
                  size="sm"
                  disabled={pending}
                  onClick={() => run(() => completeTaskAction(task.id))}
                >
                  {t("done")}
                </Button>
              ) : (
                <Button
                  size="sm"
                  disabled={pending}
                  onClick={() => run(() => startTaskAction(task.id))}
                >
                  {t("start")}
                </Button>
              )}
            </div>
          ))}
        </Panel>
      ) : null}

      <Panel
        title={t("title", { count: tasks.length })}
        actions={
          canManageOrder ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setAddTaskOpen(true)}
            >
              {t("addTask")}
            </Button>
          ) : undefined
        }
      >
        {tasks.length === 0 ? (
          <p className="text-sm text-muted">{t("empty")}</p>
        ) : (
          <ul className="divide-y divide-line">
            {tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                isBlocked={availability.get(task.id) === "blocked"}
                staff={staff}
                canWorkTasks={canWorkTasks}
                canApprove={canApprove}
                canManageBoard={canManageBoard}
                pending={pending}
                onStart={() => run(() => startTaskAction(task.id))}
                onComplete={() => run(() => completeTaskAction(task.id))}
                onApprove={() => run(() => approveTaskAction(task.id))}
                onReturn={() => setReturnTaskId(task.id)}
                onDefer={() => setDeferTaskId(task.id)}
                onResume={() => run(() => resumeTaskAction(task.id))}
                onOverride={() =>
                  run(() => setAvailabilityOverrideAction(task.id, true))
                }
                onReassign={(staffMemberId) =>
                  run(() => reassignTaskAction(task.id, staffMemberId))
                }
              />
            ))}
          </ul>
        )}
      </Panel>

      <ReturnForReworkDialog
        taskId={returnTaskId}
        open={returnTaskId !== null}
        onOpenChange={(open) => !open && setReturnTaskId(null)}
      />
      <DeferTaskDialog
        taskId={deferTaskId}
        open={deferTaskId !== null}
        onOpenChange={(open) => !open && setDeferTaskId(null)}
      />
      <AddTaskDialog
        workOrderId={workOrderId}
        taskTypes={taskTypes}
        workStages={workStages}
        open={addTaskOpen}
        onOpenChange={setAddTaskOpen}
      />
    </div>
  );
}

function TaskRow({
  task,
  isBlocked,
  staff,
  canWorkTasks,
  canApprove,
  canManageBoard,
  pending,
  onStart,
  onComplete,
  onApprove,
  onReturn,
  onDefer,
  onResume,
  onOverride,
  onReassign,
}: {
  task: HubTask;
  isBlocked: boolean;
  staff: HubData["staff"];
  canWorkTasks: boolean;
  canApprove: boolean;
  canManageBoard: boolean;
  pending: boolean;
  onStart: () => void;
  onComplete: () => void;
  onApprove: () => void;
  onReturn: () => void;
  onDefer: () => void;
  onResume: () => void;
  onOverride: () => void;
  onReassign: (staffMemberId: string | null) => void;
}) {
  const t = useTranslations("pages.orders.detail.hub.tasks");
  const tTaskStatus = useTranslations("pages.orders.taskStatus");
  const status = task.status as TaskStatus;

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
      <div className="flex items-center gap-3">
        {canManageBoard ? (
          <select
            aria-label={t("reassign")}
            value={task.assigned_staff_member_id ?? ""}
            onChange={(e) => onReassign(e.target.value || null)}
            className="h-9 rounded-control border border-line bg-surface text-xs"
          >
            <option value="">{t("unassigned")}</option>
            {staff.map((member) => (
              <option key={member.id} value={member.id}>
                {member.full_name}
              </option>
            ))}
          </select>
        ) : (
          <Avatar name={task.assignedStaffMemberName} size="sm" />
        )}
        <div>
          <p className="font-medium text-ink">{task.title}</p>
          <p className="text-xs text-muted">
            {task.workStageName}
            {task.status === "deferred" && task.deferred_reason
              ? ` · ${t("deferredReasonPrefix")}: ${task.deferred_reason}`
              : ""}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isBlocked && !TERMINAL.has(status) ? (
          <StatusChip kind="availability" status="blocked" label={t("blocked")} />
        ) : (
          <StatusChip kind="task" status={status} label={tTaskStatus(status)} />
        )}

        {isBlocked && !TERMINAL.has(status) ? (
          canManageBoard ? (
            <Button size="sm" variant="outline" onClick={onOverride}>
              {t("unlock")}
            </Button>
          ) : null
        ) : status === "awaiting_approval" && canApprove ? (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={onReturn}
              disabled={pending}
            >
              {t("returnAction")}
            </Button>
            <Button size="sm" onClick={onApprove} disabled={pending}>
              {t("approveAction")}
            </Button>
          </>
        ) : status === "deferred" && canWorkTasks ? (
          <Button
            size="sm"
            variant="outline"
            onClick={onResume}
            disabled={pending}
          >
            {t("resumeAction")}
          </Button>
        ) : STARTABLE.has(status) && canWorkTasks ? (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={onStart}
              disabled={pending}
            >
              {t("start")}
            </Button>
            {DEFERRABLE.has(status) ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={onDefer}
                disabled={pending}
              >
                {t("deferAction")}
              </Button>
            ) : null}
          </>
        ) : status === "in_progress" && canWorkTasks ? (
          <>
            <Button size="sm" onClick={onComplete} disabled={pending}>
              {t("done")}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onDefer}
              disabled={pending}
            >
              {t("deferAction")}
            </Button>
          </>
        ) : null}
      </div>
    </li>
  );
}
