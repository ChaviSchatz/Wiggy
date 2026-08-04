import type { BadgeVariant } from "@/components/ui/badge";

/** Colour mapping only -- the actual label text always comes from i18n. */
export function statusBadgeVariant(status: string): BadgeVariant {
  switch (status) {
    case "completed":
    case "ready_for_handoff":
      return "success";
    case "cancelled":
      return "danger";
    case "on_hold":
      return "warning";
    default:
      return "neutral";
  }
}

export function priorityBadgeVariant(priority: string): BadgeVariant {
  return priority === "urgent" ? "warning" : "neutral";
}
