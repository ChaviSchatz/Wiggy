import type { BadgeVariant } from "@/components/ui/badge";
import { statusVariant } from "@/components/domain/status-chip";

/**
 * Thin adapters over the one status -> colour mapping in `StatusChip`. Kept so
 * existing `<Badge variant={...}>` call sites keep working; new code should
 * render `<StatusChip>` directly rather than resolving a variant by hand.
 */

export function statusBadgeVariant(status: string): BadgeVariant {
  return statusVariant("order", status) ?? "neutral";
}

export function priorityBadgeVariant(priority: string): BadgeVariant {
  return statusVariant("urgency", priority) ?? "neutral";
}
