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
  Star,
} from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";

import {
  TaskPeekContent,
  type BlockingTaskInfo,
} from "@/components/domain/task-peek-content";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Availability } from "@/lib/availability";
import type { BoardTask } from "@/lib/board/queries";
import type { CompletedQueueTask } from "@/lib/sprints/queries";
import { cn } from "@/lib/utils";

type BlockedEntry = { task: BoardTask; reason: "sequence" | "deferred" };
type CardKind = "current" | "next" | "queue" | "blocked";

type GridEntry =
  | { kind: "current" | "next" | "queue"; task: BoardTask }
  | { kind: "blocked"; task: BoardTask; reason: "sequence" | "deferred" };

/**
 * Tablet/desktop "focus" layout for My Work. Every active task -- current,
 * next, queued, or blocked -- renders as the same size card in one grid;
 * only a badge and an accent border say which is which (design feedback:
 * varying card size by state "looks like a mess"). Completed is the one
 * deliberate exception, smaller and quieter, since it's the one state
 * that's actually behind you. Mobile keeps its own stacked-card layout.
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

  const entries: GridEntry[] = [
    ...current.map((task) => ({ kind: "current" as const, task })),
    ...(next ? [{ kind: "next" as const, task: next }] : []),
    ...queue.map((task) => ({ kind: "queue" as const, task })),
    ...blocked.map(({ task, reason }) => ({
      kind: "blocked" as const,
      task,
      reason,
    })),
  ];

  return (
    <div className="space-y-8">
      {entries.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {entries.map((entry) => (
            <TaskGridCard
              key={entry.task.id}
              task={entry.task}
              kind={entry.kind}
              availability={
                availabilityByTaskId.get(entry.task.id) ?? "available"
              }
              blockingInfo={
                entry.kind === "blocked" && entry.reason === "sequence"
                  ? getBlockingInfo(entry.task)
                  : null
              }
              blockedReason={entry.kind === "blocked" ? entry.reason : undefined}
              onStart={() => onStart(entry.task)}
              onComplete={() => onComplete(entry.task)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-card border border-dashed border-line px-6 py-8 text-center">
          <p className="text-body text-muted">{t("focus.nowEmpty")}</p>
        </div>
      )}

      {completed.length > 0 ? (
        <div className="rounded-card bg-sage-100/25 p-4">
          <h2 className="mb-3 flex items-center gap-1.5 text-label text-sage-600">
            <CheckCircle2 className="size-4" aria-hidden />
            {t("sections.completed")}
          </h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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

function DueLine({ task }: { task: BoardTask }) {
  const t = useTranslations("pages.board");
  const dueAt = task.due_at ?? task.orderDueAt;
  if (!dueAt) return null;
  return (
    <span className="mt-1 flex items-center gap-1.5 text-meta text-muted">
      <CalendarClock className="size-3.5 shrink-0" aria-hidden />
      {t("dueLabel")}{" "}
      {new Date(dueAt).toLocaleDateString("he-IL", {
        day: "2-digit",
        month: "2-digit",
      })}
    </span>
  );
}

const KIND_BORDER: Record<CardKind, string> = {
  current: "border-mauve-600/50",
  next: "border-peach-400/60",
  queue: "border-line",
  blocked: "border-line border-dashed",
};

/**
 * The one card shape for every active task, whatever state it's in --
 * `kind` only changes the top badge, the accent border colour, and the
 * bottom action, never the card's size.
 */
function TaskGridCard({
  task,
  kind,
  availability,
  blockingInfo,
  blockedReason,
  onStart,
  onComplete,
}: {
  task: BoardTask;
  kind: CardKind;
  availability: Availability;
  blockingInfo?: BlockingTaskInfo | null;
  blockedReason?: "sequence" | "deferred";
  onStart: () => void;
  onComplete: () => void;
}) {
  const t = useTranslations("pages.myWork");
  const identity = task.customerName ?? task.templateName ?? "";

  const blockedLabel =
    blockedReason === "deferred"
      ? t("deferredReason")
      : blockingInfo?.staffName
        ? t("focus.blockedByName", { name: blockingInfo.staffName })
        : t("focus.blockedGeneric");

  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-card border bg-surface p-3.5",
        KIND_BORDER[kind],
        kind === "blocked" && "opacity-80",
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        {kind === "current" ? (
          <Badge className="gap-1 bg-mauve-100 text-mauve-600">
            <Play className="size-3" fill="currentColor" aria-hidden />
            {t("sections.current")}
          </Badge>
        ) : kind === "next" ? (
          <Badge className="gap-1 bg-peach-100 text-peach-600">
            <Clock className="size-3" aria-hidden />
            {t("focus.nextUp")}
          </Badge>
        ) : (
          <span />
        )}
        {task.priority ? (
          <StarIcon />
        ) : null}
      </div>

      <PeekTrigger
        task={task}
        availability={availability}
        blockedBy={kind === "blocked" ? blockingInfo : null}
        onStart={onStart}
        onComplete={onComplete}
      >
        <p className="truncate text-body font-semibold text-ink">
          {task.title}
        </p>
        <p className="mt-1 flex items-center gap-1.5 truncate text-meta text-muted">
          <Building2 className="size-3.5 shrink-0" aria-hidden />
          {identity} <span className="tabular-nums">#{task.orderNumber}</span>
        </p>
        <DueLine task={task} />
      </PeekTrigger>

      <div className="mt-3 border-t border-line pt-3">
        {kind === "blocked" ? (
          <Badge variant="neutral" className="w-full justify-center gap-1">
            <Lock className="size-3" aria-hidden />
            <span className="truncate">{blockedLabel}</span>
          </Badge>
        ) : kind === "current" ? (
          <Button size="sm" className="w-full" onClick={onComplete}>
            <CheckCircle2 className="me-1 size-4" aria-hidden />
            {t("done")}
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={onStart}
          >
            <Play className="me-1 size-3.5" aria-hidden />
            {t("start")}
          </Button>
        )}
      </div>
    </div>
  );
}

function StarIcon() {
  const tCommon = useTranslations("common");
  return (
    <span aria-label={tCommon("priorityLabel")} title={tCommon("priorityLabel")}>
      <Star
        className="size-4 shrink-0 text-peach-500"
        fill="currentColor"
        aria-hidden
      />
    </span>
  );
}
