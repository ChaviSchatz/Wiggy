"use client";

import { ChevronDown, ChevronUp, Lock, Star } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Availability } from "@/lib/availability";
import type { AssignableStaffMember, BoardTask } from "@/lib/board/queries";
import { cn } from "@/lib/utils";

/**
 * One card in the sprint planning board -- backlog or an employee's lane.
 * Reordering is a pair of up/down buttons rather than pointer drag (no
 * drag-and-drop library in this codebase yet, and the production board
 * itself already favours inline buttons over drag for state changes --
 * see src/lib/queue/rank.ts).
 */
export function SprintTaskCard({
  task,
  rank,
  availability,
  staff,
  canMoveUp,
  canMoveDown,
  onAssign,
  onMove,
  onTogglePriority,
}: {
  task: BoardTask;
  /** 1-based position within the lane; undefined for backlog cards. */
  rank?: number;
  availability: Availability;
  staff: AssignableStaffMember[];
  canMoveUp: boolean;
  canMoveDown: boolean;
  onAssign: (staffMemberId: string | null) => void;
  onMove: (direction: "up" | "down") => void;
  onTogglePriority: () => void;
}) {
  const t = useTranslations("pages.sprint");
  const tKind = useTranslations("pages.orders.kind");
  const tTaskStatus = useTranslations("pages.orders.taskStatus");

  const isBlocked = availability === "blocked";
  const identity = task.customerName ?? tKind(task.orderKind);

  return (
    <div
      className={cn(
        "rounded-card border p-3 shadow-sm",
        isBlocked
          ? "bg-mauve-100/30 border-line opacity-70"
          : "border-line bg-surface",
      )}
    >
      <div className="mb-1.5 flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-ink">
          {rank ? <span className="me-1 text-muted">#{rank}</span> : null}
          {identity}{" "}
          <span className="font-normal text-muted">#{task.orderNumber}</span>
        </p>
        <button
          type="button"
          onClick={onTogglePriority}
          aria-pressed={task.priority}
          aria-label={t("priorityToggle")}
          className={cn(
            "shrink-0",
            task.priority ? "text-peach-500" : "text-line hover:text-muted",
          )}
        >
          <Star
            className="size-4"
            fill={task.priority ? "currentColor" : "none"}
          />
        </button>
      </div>
      <p className="text-sm text-ink">{task.title}</p>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {isBlocked ? (
          <Badge variant="neutral">
            <Lock className="me-1 size-3" aria-hidden />
            {t("blocked")}
          </Badge>
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

      <div className="mt-3 flex items-center justify-between gap-2">
        <select
          aria-label={t("assignLabel")}
          value={task.assigned_staff_member_id ?? ""}
          onChange={(event) => onAssign(event.target.value || null)}
          className="h-8 flex-1 rounded-control border border-line bg-surface px-2 text-xs text-ink"
        >
          <option value="">{t("unassignedOption")}</option>
          {staff.map((member) => (
            <option key={member.id} value={member.id}>
              {member.full_name}
            </option>
          ))}
        </select>

        {rank ? (
          <div className="flex items-center gap-1">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-8"
              disabled={!canMoveUp}
              onClick={() => onMove("up")}
              aria-label={t("moveUp")}
            >
              <ChevronUp className="size-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-8"
              disabled={!canMoveDown}
              onClick={() => onMove("down")}
              aria-label={t("moveDown")}
            >
              <ChevronDown className="size-4" />
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
