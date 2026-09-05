"use client";

import { CheckCircle2, Clock, PauseCircle, Play, RotateCcw } from "lucide-react";

import type { BadgeVariant } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { statusVariant } from "./status-chip";

const STATUS_ICON: Record<string, typeof Clock> = {
  pending: Clock,
  in_progress: Play,
  awaiting_approval: CheckCircle2,
  returned_for_rework: RotateCcw,
  deferred: PauseCircle,
};

const BADGE_ICON_CLASS: Record<BadgeVariant, string> = {
  neutral: "bg-mauve-100 text-mauve-600",
  success: "bg-sage-100 text-sage-600",
  warning: "bg-peach-100 text-peach-600",
  danger: "bg-danger-100 text-danger-600",
  info: "bg-info-100 text-info-600",
  idle: "bg-idle-100 text-idle-600",
};

function StatusIcon({ status }: { status: string }) {
  const variant = statusVariant("task", status) ?? "neutral";
  const Icon = STATUS_ICON[status] ?? Clock;
  return (
    <span
      className={cn(
        "flex size-5 shrink-0 items-center justify-center rounded-full",
        BADGE_ICON_CLASS[variant],
      )}
      aria-hidden="true"
    >
      <Icon className="size-3" />
    </span>
  );
}

/**
 * The status filter reads as a status -- a colour-tinted icon badge, the same
 * language `StatusChip` uses on the task itself -- rather than as a generic
 * dot-and-text picker like the type filter. Statuses and types are different
 * kinds of thing; they should not look like the same control.
 */
export function TaskStatusFilterSelect({
  value,
  onChange,
  statuses,
  getLabel,
  allLabel,
  ariaLabel,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  statuses: readonly string[];
  getLabel: (status: string) => string;
  allLabel: string;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <Select
      value={value || STATUS_ALL}
      onValueChange={(next) => onChange(next === STATUS_ALL ? "" : next)}
    >
      <SelectTrigger aria-label={ariaLabel} className={cn("w-auto min-w-40", className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={STATUS_ALL}>{allLabel}</SelectItem>
        {statuses.map((status) => (
          <SelectItem key={status} value={status}>
            <StatusIcon status={status} />
            <span className="truncate">{getLabel(status)}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const STATUS_ALL = "__all__";
