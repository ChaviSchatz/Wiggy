"use client";

import { Lock, Star } from "lucide-react";
import { useTranslations } from "next-intl";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Availability } from "@/lib/availability";
import type { BoardTask } from "@/lib/board/queries";

const STARTABLE = new Set(["pending", "returned_for_rework"]);

/**
 * One task, one card (ADR 0010): identity leads with customer name (or
 * order kind for customer-less orders) + order number, never a client
 * avatar; the assignee avatar is the worker (tap -> reassign); the everyday
 * action (Start/Done) is inline, no drawer needed for it.
 */
export function TaskCard({
  task,
  availability,
  canManageBoard,
  canApprove,
  onOpenPeek,
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
  onOpenPeek: () => void;
  onOpenAssignee: () => void;
  onStart: () => void;
  onComplete: () => void;
  onToggleOverride: () => void;
  onApprove: () => void;
  onReturn: () => void;
}) {
  const t = useTranslations("pages.board");
  const tKind = useTranslations("pages.orders.kind");
  const tTaskStatus = useTranslations("pages.orders.taskStatus");
  const tCommon = useTranslations("common");

  const isBlocked = availability === "blocked";
  const identity = task.customerName ?? tKind(task.orderKind);

  return (
    <div
      className={cn(
        "rounded-card border p-3 shadow-sm transition-opacity",
        isBlocked
          ? "bg-mauve-100/30 border-line opacity-70"
          : "border-line bg-surface",
      )}
    >
      <button
        type="button"
        onClick={onOpenPeek}
        className="block w-full text-start"
      >
        <p className="flex items-center gap-1.5 text-sm font-medium text-ink">
          <span>
            {identity}{" "}
            <span className="font-normal text-muted">#{task.orderNumber}</span>
          </span>
          {task.priority ? (
            <span aria-label={tCommon("priorityLabel")} title={tCommon("priorityLabel")}>
              <Star
                className="size-3.5 shrink-0 text-peach-500"
                fill="currentColor"
                aria-hidden
              />
            </span>
          ) : null}
        </p>
        <p className="text-sm text-ink">{task.title}</p>
      </button>

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

        {isBlocked ? (
          <div className="flex items-center gap-2">
            <Badge variant="neutral">
              <Lock className="me-1 size-3" aria-hidden />
              {t("blocked")}
            </Badge>
            {canManageBoard ? (
              <Button size="sm" variant="outline" onClick={onToggleOverride}>
                {t("unlock")}
              </Button>
            ) : null}
          </div>
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
          <Badge
            variant={
              task.status === "awaiting_approval" ? "warning" : "neutral"
            }
          >
            {tTaskStatus(task.status)}
          </Badge>
        )}
      </div>
    </div>
  );
}
