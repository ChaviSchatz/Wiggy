"use client";

import { useEffect, useState } from "react";
import { Lock, Star } from "lucide-react";
import { useTranslations } from "next-intl";

import { StatusChip } from "@/components/domain/status-chip";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { Availability } from "@/lib/availability";
import type { BoardTask } from "@/lib/board/queries";
import { TaskPeekContent } from "./task-peek-content";

const STARTABLE = new Set(["pending", "returned_for_rework"]);

/**
 * One task, one card (ADR 0010). Composition is fixed in
 * docs/ui/screen-designs.md §6: identity leads with the customer name (or order
 * kind for customer-less orders), the task title is the second line, and the
 * footer carries assignee / due date / state.
 *
 * Deliberately absent: any photo or thumbnail, the order kind, the stage name,
 * and an overflow menu. The column already *is* the stage, and photos belong to
 * the peek and the hub.
 */
export function TaskCard({
  task,
  availability,
  canManageBoard,
  canApprove,
  onOpenAssignee,
  onStart,
  onComplete,
  onToggleOverride,
  onApprove,
  onReturn,
}: {
  task: BoardTask;
  availability: Availability;
  canManageBoard: boolean;
  canApprove: boolean;
  onOpenAssignee: () => void;
  onStart: () => void;
  onComplete: () => void;
  onToggleOverride: () => void;
  onApprove: () => void;
  onReturn: () => void;
}) {
  const t = useTranslations("pages.board");
  const tTaskStatus = useTranslations("pages.orders.taskStatus");
  const tCommon = useTranslations("common");

  const isBlocked = availability === "blocked";
  const identity = task.customerName ?? task.templateName ?? "";
  // The task's own date wins; the order's is the fallback; neither means the
  // slot renders nothing at all (ADR 0012).
  const dueAt = task.due_at ?? task.orderDueAt;

  // Resolved after mount so server and client agree on the first render.
  const [isLate, setIsLate] = useState(false);
  useEffect(() => {
    setIsLate(dueAt !== null && new Date(dueAt).getTime() < Date.now());
  }, [dueAt]);

  // The peek is a Popover anchored to this card (design-system.md "Popover")
  // rather than a screen-edge drawer -- a quick glance stays next to the
  // task it's about instead of opening a large separate panel.
  const [peekOpen, setPeekOpen] = useState(false);

  return (
    <div
      className={cn(
        "rounded-card border border-s-2 border-line border-s-mauve-100 bg-surface p-3 transition-all",
        isBlocked
          ? "opacity-70"
          : "hover:-translate-y-px hover:border-line-strong",
      )}
    >
      <Popover open={peekOpen} onOpenChange={setPeekOpen}>
        <PopoverTrigger asChild>
          <button type="button" className="block w-full text-start">
            <p className="flex items-center justify-between gap-1.5">
              <span className="flex min-w-0 items-center gap-1.5">
                <span className="min-w-0 truncate text-identity text-ink">
                  {identity}{" "}
                  <span className="font-normal tabular-nums text-muted">
                    #{task.orderNumber}
                  </span>
                </span>
                {task.priority ? (
                  <span
                    aria-label={tCommon("priorityLabel")}
                    title={tCommon("priorityLabel")}
                  >
                    <Star
                      className="size-3.5 shrink-0 text-danger-500"
                      fill="currentColor"
                      aria-hidden
                    />
                  </span>
                ) : null}
              </span>
              {dueAt ? (
                <span
                  className={cn(
                    "shrink-0 text-meta tabular-nums",
                    isLate ? "font-medium text-danger-600" : "text-muted",
                  )}
                  title={t("dueLabel")}
                >
                  {new Date(dueAt).toLocaleDateString("he-IL", {
                    day: "2-digit",
                    month: "2-digit",
                  })}
                </span>
              ) : null}
            </p>
            <p className="text-body text-ink">{task.title}</p>
          </button>
        </PopoverTrigger>
        <PopoverContent>
          <TaskPeekContent
            task={task}
            availability={availability}
            onStart={() => {
              setPeekOpen(false);
              onStart();
            }}
            onComplete={() => {
              setPeekOpen(false);
              onComplete();
            }}
          />
        </PopoverContent>
      </Popover>

      <div className="mt-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={canManageBoard ? onOpenAssignee : undefined}
          aria-label={t("reassign")}
          disabled={!canManageBoard}
          className={cn("rounded-full", canManageBoard && "cursor-pointer")}
        >
          <Avatar name={task.assignedStaffMemberName} size="sm" />
        </button>

        <div className="flex min-w-0 items-center gap-2">
          {isBlocked ? (
            <>
              <StatusChip
                kind="availability"
                status="blocked"
                label={t("blocked")}
                icon={<Lock className="size-3" aria-hidden />}
              />
              {canManageBoard ? (
                <Button size="sm" variant="outline" onClick={onToggleOverride}>
                  {t("unlock")}
                </Button>
              ) : null}
            </>
          ) : STARTABLE.has(task.status) ? (
            <Button size="sm" variant="outline" onClick={onStart}>
              {t("start")}
            </Button>
          ) : task.status === "in_progress" ? (
            <Button size="sm" onClick={onComplete}>
              {t("done")}
            </Button>
          ) : task.status === "awaiting_approval" && canApprove ? (
            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" onClick={onReturn}>
                {t("returnAction")}
              </Button>
              <Button size="sm" onClick={onApprove}>
                {t("approveAction")}
              </Button>
            </div>
          ) : (
            <StatusChip
              kind="task"
              status={task.status}
              label={tTaskStatus(task.status)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
