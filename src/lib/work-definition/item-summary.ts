import type { IntakeItemConfig } from "@/lib/work-orders/types";
import type { IntakeItemKind } from "./validation";

/**
 * The quiet meta line under a builder row (screen inventory #51).
 *
 * The builder renders each item as the real, read-only form control, so the
 * *shape* of an item is self-evident. What a rendered control cannot show is
 * its behaviour: that a question is required, that ticking a task creates
 * work, or -- most importantly -- that an ordinary-looking yes/no question is
 * a missing-stock flag that silently creates a tracked item and a dashboard
 * alert (ADR 0011). This function supplies exactly that.
 *
 * Pure: returns message keys and a tone, never rendered text, so it is
 * unit-testable without a DOM and the copy stays in the catalog.
 *
 * `warning` entries sort first, because they describe consequences the
 * manager would not otherwise expect.
 */

export type SummaryTone = "muted" | "warning";

export type SummaryEntry = {
  /** Key under `pages.settings.templates.summary`. */
  messageKey: string;
  tone: SummaryTone;
};

export function itemSummary(
  kind: IntakeItemKind,
  config: IntakeItemConfig | Record<string, unknown>,
): SummaryEntry[] {
  const c = config as IntakeItemConfig;
  const warnings: SummaryEntry[] = [];
  const notes: SummaryEntry[] = [];

  if (kind === "field") {
    if (c.missing_item_kind) {
      warnings.push({ messageKey: "missingItem", tone: "warning" });
    }
    if (c.visible === false) {
      notes.push({ messageKey: "hidden", tone: "muted" });
    }
    if (c.mandatory) {
      notes.push({ messageKey: "mandatory", tone: "muted" });
    }
  }

  if (kind === "task_type") {
    if (c.mandatory) notes.push({ messageKey: "mandatory", tone: "muted" });
    if (c.default_selected) {
      notes.push({ messageKey: "defaultSelected", tone: "muted" });
    }
    pushGenerates(c, warnings, notes);
  }

  if (kind === "task_group") {
    if (c.selection_mode) {
      notes.push({
        messageKey: `selectionMode.${c.selection_mode}`,
        tone: "muted",
      });
    }
    pushGenerates(c, warnings, notes);
  }

  if (kind === "section" && c.allow_other) {
    notes.push({ messageKey: "allowOther", tone: "muted" });
  }

  return [...warnings, ...notes];
}

/**
 * `generates_runtime_tasks` is the one setting that can quietly make an item
 * pointless: legal, but the selection would produce nothing at all.
 */
function pushGenerates(
  config: IntakeItemConfig,
  warnings: SummaryEntry[],
  notes: SummaryEntry[],
) {
  if (config.generates_runtime_tasks === false) {
    warnings.push({ messageKey: "generatesNothing", tone: "warning" });
    return;
  }
  if (config.generates_runtime_tasks) {
    notes.push({ messageKey: "generatesTasks", tone: "muted" });
  }
}
