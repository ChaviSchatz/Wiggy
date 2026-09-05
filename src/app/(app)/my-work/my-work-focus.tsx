"use client";

import Link from "next/link";
import {
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock,
  ExternalLink,
  Lock,
  Play,
} from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";

import {
  TaskPeekContent,
  type BlockingTaskInfo,
} from "@/components/domain/task-peek-content";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Availability } from "@/lib/availability";
import type { BoardTask } from "@/lib/board/queries";
import type { CompletedQueueTask } from "@/lib/sprints/queries";
import { cn } from "@/lib/utils";

type BlockedEntry = { task: BoardTask; reason: "sequence" | "deferred" };

const STATUS_BADGE_CLASS = "bg-info-100 text-info-600";
const NEXT_BADGE_CLASS = "bg-peach-100 text-peach-600";

/**
 * Tablet/desktop "focus" layout for My Work: a dedicated work-management
 * view, not a smaller production board. Visual, not row-and-text -- icons,
 * badges, and an avatar carry meaning that used to be plain text, and the
 * three tiers (now / up next+queue / completed) get progressively quieter
 * treatment top to bottom instead of matching boxes. Mobile keeps its own
 * stacked-card layout untouched.
 */
export function MyWorkFocus({
  current,
  next,
  queue,
  blocked,
  completed,
  availabilityByTaskId,
  getBlockingInfo,
  onStart,
  onComplete,
}: {
  current: BoardTask[];
  next: BoardTask | null;
  queue: BoardTask[];
  blocked: BlockedEntry[];
  completed: CompletedQueueTask[];
  availabilityByTaskId: Map<string, Availability>;
  getBlockingInfo: (task: BoardTask) => BlockingTaskInfo | null;
  onStart: (task: BoardTask) => void;
  onComplete: (task: BoardTask) => void;
}) {
  const t = useTranslations("pages.myWork");
  const totalActive = current.length + (next ? 1 : 0) + queue.length;
  const restOfQueue = queue.length > 0 || blocked.length > 0;

  return (
    <div className="space-y-8">
      <div
        className={cn(
          "grid gap-4",
          next ? "items-stretch md:grid-cols-3" : "",
        )}
      >
        <div className={next ? "md:col-span-2" : ""}>
          {current.length > 0 ? (
            <div className="space-y-3">
              {current.map((task, index) => (
                <NowCard
                  key={task.id}
                  task={task}
                  position={index + 1}
                  total={totalActive}
                  availability={
                    availabilityByTaskId.get(task.id) ?? "available"
                  }
                  onStart={() => onStart(task)}
                  onComplete={() => onComplete(task)}
                />
              ))}
            </div>
          ) : (
            <div className="flex h-full min-h-32 items-center justify-center rounded-card border border-dashed border-line px-6 py-8 text-center">
              <p className="text-body text-muted">{t("focus.nowEmpty")}</p>
            </div>
          )}
        </div>

        {next ? (
          <NextCard
            task={next}
            availability={availabilityByTaskId.get(next.id) ?? "available"}
            onStart={() => onStart(next)}
            onComplete={() => onComplete(next)}
          />
        ) : null}
      </div>

      {restOfQueue ? (
        <div>
          <h2 className="mb-3 text-label text-muted">{t("sections.queue")}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {queue.map((task) => (
              <QueueCard
                key={task.id}
                task={task}
                availability={availabilityByTaskId.get(task.id) ?? "available"}
                onStart={() => onStart(task)}
                onComplete={() => onComplete(task)}
              />
            ))}
            {blocked.map(({ task, reason }) => (
              <BlockedCard
                key={task.id}
                task={task}
                reason={reason}
                blockingInfo={
                  reason === "sequence" ? getBlockingInfo(task) : null
                }
                availability={availabilityByTaskId.get(task.id) ?? "available"}
                onStart={() => onStart(task)}
                onComplete={() => onComplete(task)}
              />
            ))}
          </div>
        </div>
      ) : null}

      {completed.length > 0 ? (
        <div className="rounded-card bg-sage-100/25 p-4">
          <h2 className="mb-3 flex items-center gap-1.5 text-label text-sage-600">
            <CheckCircle2 className="size-4" aria-hidden />
            {t("sections.completed")}
          </h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {completed.map((task) => (
              <Link
                key={task.id}
                href={`/orders/${task.workOrderId}`}
                className="flex items-start gap-2 rounded-control bg-surface/60 px-3 py-2 hover:bg-surface"
              >
                <CheckCircle2
                  className="mt-0.5 size-3.5 shrink-0 text-sage-500"
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-meta text-ink">
                    {task.title}
                  </span>
                  <span className="block truncate text-meta text-muted">
                    {task.customerName ?? "—"} #{task.orderNumber}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-1 text-meta text-sage-600">
                  {task.completedAt
                    ? new Date(task.completedAt).toLocaleDateString("he-IL")
                    : ""}
                  <ExternalLink className="size-3" aria-hidden />
                </span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PeekTrigger({
  task,
  availability,
  blockedBy,
  onStart,
  onComplete,
  children,
}: {
  task: BoardTask;
  availability: Availability;
  blockedBy?: BlockingTaskInfo | null;
  onStart: () => void;
  onComplete: () => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className="block w-full min-w-0 flex-1 text-start">
          {children}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start">
        <TaskPeekContent
          task={task}
          availability={availability}
          blockedBy={blockedBy}
          onStart={() => {
            setOpen(false);
            onStart();
          }}
          onComplete={() => {
            setOpen(false);
            onComplete();
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

/** `due_at`/order due date, the only "when" data a task actually carries
 * (there's no persisted per-task duration estimate). */
function DueLine({ task }: { task: BoardTask }) {
  const t = useTranslations("pages.board");
  const dueAt = task.due_at ?? task.orderDueAt;
  if (!dueAt) return null;
  return (
    <span className="flex items-center gap-1.5 text-meta text-muted">
      <CalendarClock className="size-3.5 shrink-0" aria-hidden />
      {t("dueLabel")}{" "}
      {new Date(dueAt).toLocaleDateString("he-IL", {
        day: "2-digit",
        month: "2-digit",
      })}
    </span>
  );
}

function NowCard({
  task,
  position,
  total,
  availability,
  onStart,
  onComplete,
}: {
  task: BoardTask;
  position: number;
  total: number;
  availability: Availability;
  onStart: () => void;
  onComplete: () => void;
}) {
  const t = useTranslations("pages.myWork");
  const identity = task.customerName ?? task.templateName ?? "";

  return (
    <div className="rounded-card border border-mauve-600/25 bg-surface p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-meta font-medium",
            STATUS_BADGE_CLASS,
          )}
        >
          <Play className="size-3.5 shrink-0" fill="currentColor" aria-hidden />
          {t("sections.current")}
        </span>
        {total > 1 ? (
          <Badge variant="neutral">
            {t("focus.position", { position, total })}
          </Badge>
        ) : null}
      </div>

      <PeekTrigger
        task={task}
        availability={availability}
        onStart={onStart}
        onComplete={onComplete}
      >
        <p className="mt-3 text-page text-ink">{task.title}</p>
        <p className="mt-1.5 flex items-center gap-1.5 text-body text-muted">
          <Building2 className="size-4 shrink-0" aria-hidden />
          {identity} <span className="tabular-nums">#{task.orderNumber}</span>
        </p>
        <div className="mt-1.5">
          <DueLine task={task} />
        </div>
      </PeekTrigger>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4">
        <span className="flex items-center gap-2 text-meta text-muted">
          <Avatar name={task.assignedStaffMemberName} size="sm" />
          {task.assignedStaffMemberName}
        </span>
        <Button size="lg" onClick={onComplete}>
          <CheckCircle2 className="me-1.5 size-5" aria-hidden />
          {t("done")}
        </Button>
      </div>
    </div>
  );
}

function NextCard({
  task,
  availability,
  onStart,
  onComplete,
}: {
  task: BoardTask;
  availability: Availability;
  onStart: () => void;
  onComplete: () => void;
}) {
  const t = useTranslations("pages.myWork");
  const identity = task.customerName ?? task.templateName ?? "";

  return (
    <div className="flex flex-col rounded-card border border-line bg-peach-100/20 p-4">
      <span
        className={cn(
          "inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-meta font-medium",
          NEXT_BADGE_CLASS,
        )}
      >
        <Clock className="size-3.5 shrink-0" aria-hidden />
        {t("focus.nextUp")}
      </span>

      <PeekTrigger
        task={task}
        availability={availability}
        onStart={onStart}
        onComplete={onComplete}
      >
        <p className="mt-2.5 truncate text-identity text-ink">{task.title}</p>
        <p className="mt-1 flex items-center gap-1.5 truncate text-meta text-muted">
          <Building2 className="size-3.5 shrink-0" aria-hidden />
          {identity} #{task.orderNumber}
        </p>
        <div className="mt-1">
          <DueLine task={task} />
        </div>
      </PeekTrigger>

      <Button
        size="sm"
        variant="outline"
        className="mt-3 w-full"
        onClick={onStart}
      >
        <Play className="me-1 size-3.5" aria-hidden />
        {t("start")}
      </Button>
    </div>
  );
}

function QueueCard({
  task,
  availability,
  onStart,
  onComplete,
}: {
  task: BoardTask;
  availability: Availability;
  onStart: () => void;
  onComplete: () => void;
}) {
  const t = useTranslations("pages.myWork");
  const identity = task.customerName ?? task.templateName ?? "";

  return (
    <div className="flex flex-col rounded-card border border-line bg-surface p-3 transition-colors hover:border-line-strong">
      <PeekTrigger
        task={task}
        availability={availability}
        onStart={onStart}
        onComplete={onComplete}
      >
        <span className="flex items-center gap-1.5">
          <span className="size-2 shrink-0 rounded-full bg-mauve-600" aria-hidden />
          <span className="truncate text-body font-medium text-ink">
            {task.title}
          </span>
        </span>
        <span className="mt-1 flex items-center gap-1.5 truncate text-meta text-muted">
          <Building2 className="size-3.5 shrink-0" aria-hidden />
          {identity} #{task.orderNumber}
        </span>
      </PeekTrigger>
      <Button
        size="sm"
        variant="outline"
        className="mt-2.5 w-full"
        onClick={onStart}
      >
        {t("start")}
      </Button>
    </div>
  );
}

function BlockedCard({
  task,
  reason,
  blockingInfo,
  availability,
  onStart,
  onComplete,
}: {
  task: BoardTask;
  reason: "sequence" | "deferred";
  blockingInfo: BlockingTaskInfo | null;
  availability: Availability;
  onStart: () => void;
  onComplete: () => void;
}) {
  const t = useTranslations("pages.myWork");
  const identity = task.customerName ?? task.templateName ?? "";
  const label =
    reason === "deferred"
      ? t("deferredReason")
      : blockingInfo?.staffName
        ? t("focus.blockedByName", { name: blockingInfo.staffName })
        : t("focus.blockedGeneric");

  return (
    <div className="flex flex-col rounded-card border border-dashed border-line bg-surface p-3 opacity-80">
      <PeekTrigger
        task={task}
        availability={availability}
        blockedBy={reason === "sequence" ? blockingInfo : null}
        onStart={onStart}
        onComplete={onComplete}
      >
        <span className="flex items-center gap-1.5">
          <span className="size-2 shrink-0 rounded-full bg-idle-600" aria-hidden />
          <span className="truncate text-body font-medium text-ink">
            {task.title}
          </span>
        </span>
        <span className="mt-1 flex items-center gap-1.5 truncate text-meta text-muted">
          <Building2 className="size-3.5 shrink-0" aria-hidden />
          {identity} #{task.orderNumber}
        </span>
      </PeekTrigger>
      <Badge variant="neutral" className="mt-2.5 w-fit gap-1">
        <Lock className="size-3" aria-hidden />
        {label}
      </Badge>
    </div>
  );
}
