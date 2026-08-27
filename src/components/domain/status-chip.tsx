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
  | "task"
  | "order"
  | "missingItem"
  | "urgency"
  | "availability";

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

export function StatusChip({
  kind,
  status,
  label,
  icon,
  className,
}: {
  kind: StatusKind;
  status: string;
  /** Already translated -- the caller owns its i18n namespace. */
  label: string;
  icon?: React.ReactNode;
  className?: string;
}) {
  const variant = statusVariant(kind, status);
  if (!variant) return null;

  return (
    <Badge variant={variant} className={cn("gap-1", className)}>
      {icon}
      {label}
    </Badge>
  );
}
