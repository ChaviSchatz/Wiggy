import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * The single place domain vocabulary maps to colour (design-system.md §4).
 * Callers pass meaning -- a domain `kind` plus its status value -- never a
 * colour, so a change to what "awaiting approval" looks like is one edit here
 * rather than a hunt through every screen.
 *
 * Labels stay at the call site because each surface reads them from its own
 * i18n namespace; only the colour decision lives here.
 */
export type StatusKind =
  "task" | "order" | "missingItem" | "urgency" | "availability";

/** `null` means "render nothing" -- see `urgency: normal` and ADR 0012. */
const VARIANTS: Record<StatusKind, Record<string, BadgeVariant | null>> = {
  task: {
    pending: "neutral",
    in_progress: "info",
    awaiting_approval: "warning",
    returned_for_rework: "danger",
    deferred: "idle",
    done: "success",
    skipped: "idle",
    cancelled: "idle",
  },
  order: {
    draft: "idle",
    confirmed: "neutral",
    active: "info",
    ready_for_handoff: "success",
    completed: "success",
    on_hold: "warning",
    cancelled: "idle",
  },
  missingItem: {
    open: "danger",
    found: "warning",
    ordered: "warning",
    handled: "success",
  },
  urgency: {
    // Normal urgency renders as nothing: a chip on every row communicates
    // nothing and spends the view's colour budget (ADR 0012).
    normal: null,
    urgent: "danger",
  },
  availability: {
    available: null,
    // Blocked means "cannot be worked on", not "worry about this", so it reads
    // as inactive rather than as a hot colour.
    blocked: "idle",
  },
};

export function statusVariant(
  kind: StatusKind,
  status: string,
): BadgeVariant | null {
  const variant = VARIANTS[kind][status];
  return variant === undefined ? "neutral" : variant;
}

// The `-500` mid-tone is reserved for dots and borders (never text --
// see badge.tsx). `mauve` has no `-500` step, so `neutral` falls back to
// `-600`, the same colour its label already uses.
const DOT_CLASS: Record<BadgeVariant, string> = {
  neutral: "bg-mauve-600",
  success: "bg-sage-500",
  warning: "bg-peach-500",
  danger: "bg-danger-500",
  info: "bg-info-500",
  idle: "bg-idle-500",
};

export function StatusChip({
  kind,
  status,
  label,
  icon,
  /** The colour-family dot that leads the label (design-system.md §4). Turn off for a chip that already carries its own icon. */
  dot = true,
  className,
}: {
  kind: StatusKind;
  status: string;
  /** Already translated -- the caller owns its i18n namespace. */
  label: string;
  icon?: React.ReactNode;
  dot?: boolean;
  className?: string;
}) {
  const variant = statusVariant(kind, status);
  if (!variant) return null;

  return (
    <Badge variant={variant} className={cn("gap-1", className)}>
      {icon ??
        (dot ? (
          <span
            className={cn("size-[6px] shrink-0 rounded-full", DOT_CLASS[variant])}
            aria-hidden="true"
          />
        ) : null)}
      {label}
    </Badge>
  );
}
