"use client";

import { CircleCheck, Lock, Play, Star } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { completeTaskAction, startTaskAction } from "@/lib/board/actions";
import type { BoardTask } from "@/lib/board/queries";
import { computeAvailability, type TaskStatus } from "@/lib/availability";
import { deriveQueueSections } from "@/lib/queue/derive";
import type { CompletedQueueTask } from "@/lib/sprints/queries";
import { cn } from "@/lib/utils";

function TaskLine({ task }: { task: BoardTask }) {
  const tKind = useTranslations("pages.orders.kind");
  const tCommon = useTranslations("common");
  const identity = task.customerName ?? tKind(task.orderKind);
  return (
    <p className="flex items-center gap-1.5 text-sm font-medium text-ink">
      <span>
        {identity} <span className="font-normal text-muted">#{task.orderNumber}</span>
        {" · "}
        {task.title}
      </span>
      {task.priority ? (
        <span aria-label={tCommon("priorityLabel")} title={tCommon("priorityLabel")}>
          <Star className="size-3.5 shrink-0 text-peach-500" fill="currentColor" aria-hidden />
        </span>
      ) : null}
    </p>
  );
}

export function MyWorkQueue({
  staffMemberId,
  initialTasks,
  completed,
}: {
  staffMemberId: string | null;
  initialTasks: BoardTask[];
  completed: CompletedQueueTask[];
}) {
  const t = useTranslations("pages.myWork");
  const [tasks, setTasks] = useState(initialTasks);

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

  const myTasks = useMemo(
    () => tasks.filter((task) => task.assigned_staff_member_id === staffMemberId),
    [tasks, staffMemberId],
  );

  const sections = useMemo(
    () =>
      deriveQueueSections(
        myTasks.map((task) => ({
          id: task.id,
          status: task.status as TaskStatus,
          queueRank: task.queue_rank,
        })),
        availabilityByTaskId,
      ),
    [myTasks, availabilityByTaskId],
  );

  const taskById = useMemo(
    () => new Map(myTasks.map((task) => [task.id, task])),
    [myTasks],
  );

  function updateTask(taskId: string, patch: Partial<BoardTask>) {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...patch } : t)));
  }

  async function handleStart(task: BoardTask) {
    updateTask(task.id, { status: "in_progress", started_at: new Date().toISOString() });
    const result = await startTaskAction(task.id);
    if (!result.success) updateTask(task.id, { status: task.status, started_at: task.started_at });
  }

  async function handleComplete(task: BoardTask) {
    const nextStatus: TaskStatus = task.requires_approval ? "awaiting_approval" : "done";
    updateTask(task.id, {
      status: nextStatus,
      completed_at: nextStatus === "done" ? new Date().toISOString() : null,
    });
    const result = await completeTaskAction(task.id);
    if (!result.success) {
      updateTask(task.id, { status: task.status, completed_at: task.completed_at });
    }
  }

  if (!staffMemberId) {
    return (
      <div>
        <PageHeader title={t("title")} />
        <EmptyState title={t("noProfileTitle")} description={t("noProfileDescription")} />
      </div>
    );
  }

  const current = sections.current.map((s) => taskById.get(s.id)).filter(Boolean) as BoardTask[];
  const next = sections.next ? (taskById.get(sections.next.id) ?? null) : null;
  const queue = sections.queue.map((s) => taskById.get(s.id)).filter(Boolean) as BoardTask[];
  const blocked = sections.blocked
    .map((entry) => ({ task: taskById.get(entry.task.id), reason: entry.reason }))
    .filter((entry): entry is { task: BoardTask; reason: "sequence" | "deferred" } =>
      Boolean(entry.task),
    );

  const isEmpty =
    current.length === 0 &&
    !next &&
    queue.length === 0 &&
    blocked.length === 0 &&
    completed.length === 0;

  return (
    <div className="space-y-4">
      <PageHeader title={t("title")} />

      {isEmpty ? (
        <EmptyState title={t("emptyTitle")} description={t("emptyDescription")} />
      ) : (
        <>
          {current.map((task) => (
            <Card key={task.id} className="border-2 border-ring bg-mauve-100/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wide text-muted">
                  {t("sections.current")}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-3 pt-0">
                <TaskLine task={task} />
                <Button size="lg" onClick={() => handleComplete(task)}>
                  <CircleCheck className="me-1 size-4" aria-hidden />
                  {t("done")}
                </Button>
              </CardContent>
            </Card>
          ))}

          {next ? (
            <Card className="border-2 border-sage-600/40 bg-sage-100/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wide text-muted">
                  {t("sections.next")}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-3 pt-0">
                <TaskLine task={next} />
                <Button size="lg" variant="outline" onClick={() => handleStart(next)}>
                  <Play className="me-1 size-4" aria-hidden />
                  {t("start")}
                </Button>
              </CardContent>
            </Card>
          ) : null}

          {queue.length > 0 ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wide text-muted">
                  {t("sections.queue")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {queue.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between gap-3 rounded-control border border-line p-2"
                  >
                    <TaskLine task={task} />
                    <Button size="sm" variant="outline" onClick={() => handleStart(task)}>
                      {t("start")}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          {blocked.length > 0 ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wide text-muted">
                  {t("sections.blocked")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {blocked.map(({ task, reason }) => (
                  <div
                    key={task.id}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-control border border-dashed border-line p-2 opacity-70",
                    )}
                  >
                    <TaskLine task={task} />
                    <Badge variant="neutral">
                      <Lock className="me-1 size-3" aria-hidden />
                      {reason === "deferred" ? t("deferredReason") : t("sequenceReason")}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          {completed.length > 0 ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wide text-muted">
                  {t("sections.completed")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {completed.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between gap-3 rounded-control border border-line p-2"
                  >
                    <p className="text-sm text-ink">
                      {task.customerName ?? "—"}{" "}
                      <span className="text-muted">#{task.orderNumber}</span> · {task.title}
                    </p>
                    <Badge variant="success">
                      {task.completedAt
                        ? new Date(task.completedAt).toLocaleDateString("he-IL")
                        : ""}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </>
      )}
    </div>
  );
}
