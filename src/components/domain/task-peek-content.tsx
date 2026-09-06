"use client";

import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";

import { StatusChip } from "@/components/domain/status-chip";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Availability, TaskStatus } from "@/lib/availability";
import { canUndoComplete } from "@/lib/board/transitions";
import type { BoardTask } from "@/lib/board/queries";

const STARTABLE = new Set(["pending", "returned_for_rework"]);

/**
 * Who and what a sequence-blocked task is actually waiting on -- not just
 * "blocked", but a name and a task to ask about (see `findBlockingTask`).
 */
export type BlockingTaskInfo = {
  staffName: string | null;
  taskLabel: string;
  status: string;
};

/**
 * The peek's content, shown inside a Popover anchored to whatever task row
 * or card opened it -- the board and My Work both use this (design-system.md
 * "Popover": a quick glance next to what triggered it, not a screen-edge
 * drawer). Compact by design: everyday actions (Start/Done) already live
 * inline on the row right behind this, so this only needs the details that
 * don't fit there, plus a way out to the full order.
 */
export function TaskPeekContent({
  task,
  availability,
  blockedBy,
  canActOnTask = true,
  onStart,
  onComplete,
  onReopen,
}: {
  task: BoardTask;
  availability: Availability;
  /** Only meaningful when `availability` is "blocked". `null`/omitted falls
   * back to a plain "blocked" chip -- e.g. a deferred task isn't waiting on
   * anyone in particular. */
  blockedBy?: BlockingTaskInfo | null;
  /** Whether the viewer may Start/Done *this* task (`canActOnTask` in
   * `board/transitions.ts`) -- a plain worker only on their own assignment,
   * a manager on any. Defaults to true for callers (like My Work) that only
   * ever show the viewer's own tasks in the first place. */
  canActOnTask?: boolean;
  onStart: () => void;
  onComplete: () => void;
  /** Undoes a mistaken "done"/"awaiting approval" back to in-progress
   * (`undoCompleteTaskAction`). Omit where there's nothing to reopen into
   * (e.g. the board, which already offers this via its own UndoToast).
   * Hidden once an approver has actually acted on the task -- see
   * `canUndoComplete`. */
  onReopen?: () => void;
}) {
  const t = useTranslations("pages.board");
  const tTaskStatus = useTranslations("pages.orders.taskStatus");
  const canReopen =
    Boolean(onReopen) &&
    canActOnTask &&
    canUndoComplete(task.status as TaskStatus, task.requires_approval);

  const identity = task.customerName ?? task.templateName ?? "";

  return (
    <div className="space-y-3">
      <div className="space-y-0.5">
        <p className="text-body font-semibold text-ink">{task.title}</p>
        <p className="text-meta text-muted">
          {identity} · #{task.orderNumber}
        </p>
      </div>

      <div className="space-y-2 text-meta">
        <div className="flex items-center justify-between">
          <span className="text-muted">{t("peek.status")}</span>
          <StatusChip
            kind="task"
            status={task.status}
            label={tTaskStatus(task.status)}
          />
        </div>
        {availability === "blocked" ? (
          blockedBy ? (
            <div className="space-y-1.5 rounded-control bg-idle-100/50 p-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted">{t("peek.blockedWaitingFor")}</span>
                <span className="flex items-center gap-1.5 font-medium text-ink">
                  <Avatar name={blockedBy.staffName} size="sm" />
                  {blockedBy.staffName ?? t("peek.blockedUnassigned")}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted">{t("peek.blockedWorkingOn")}</span>
                <span className="truncate text-ink">{blockedBy.taskLabel}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted">{t("peek.status")}</span>
                <StatusChip
                  kind="task"
                  status={blockedBy.status}
                  label={tTaskStatus(blockedBy.status)}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-muted">{t("peek.availability")}</span>
              <StatusChip
                kind="availability"
                status="blocked"
                label={t("blocked")}
              />
            </div>
          )
        ) : null}
        <div className="flex items-center justify-between">
          <span className="text-muted">{t("peek.assignee")}</span>
          <span className="flex items-center gap-1.5">
            <Avatar name={task.assignedStaffMemberName} size="sm" />
            {task.assignedStaffMemberName ?? t("peek.unassigned")}
          </span>
        </div>
        {task.requires_approval ? (
          <div className="flex items-center justify-between">
            <span className="text-muted">{t("peek.requiresApproval")}</span>
            <Badge variant="warning">{t("peek.yes")}</Badge>
          </div>
        ) : null}
        {task.description ? (
          <div>
            <p className="text-muted">{t("peek.description")}</p>
            <p className="text-ink">{task.description}</p>
          </div>
        ) : null}
        {task.production_notes ? (
          <div>
            <p className="text-muted">{t("peek.productionNotes")}</p>
            <p className="text-ink">{task.production_notes}</p>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5 border-t border-line pt-3">
        {canActOnTask && availability !== "blocked" && STARTABLE.has(task.status) ? (
          <Button size="sm" onClick={onStart}>
            {t("start")}
          </Button>
        ) : null}
        {canActOnTask && task.status === "in_progress" ? (
          <Button size="sm" onClick={onComplete}>
            {t("done")}
          </Button>
        ) : null}
        <div className="flex items-center gap-1.5">
          {canReopen ? (
            <Button
              size="icon"
              variant="outline"
              className="size-8 shrink-0"
              onClick={onReopen}
              aria-label={t("peek.reopen")}
              title={t("peek.reopen")}
            >
              <RotateCcw className="size-3.5" aria-hidden />
            </Button>
          ) : null}
          <Button size="sm" variant="outline" className="flex-1" asChild>
            <Link href={`/orders/${task.work_order_id}`}>
              {t("peek.openOrder")}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
