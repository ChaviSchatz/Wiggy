import type { IntakeItemConfig } from "@/lib/work-orders/types";
import type { IntakeItemKind } from "./validation";

/**
 * The config a *newly added* template item starts with (screen inventory
 * #51). The add dialog collects only what identifies the item -- its kind,
 * its referent or label -- and the config dialog (#52) tunes the rest, so
 * these defaults decide how the item behaves until someone edits it.
 *
 * They are not cosmetic. The intake wizard renders a field only when
 * `config.visible !== false`, so a field created with `visible: false` is
 * silently invisible: the tenant adds it, and it never appears on the form.
 * Defaulting to the useful state is the difference between the builder
 * working and appearing broken.
 */
export function defaultConfigFor(kind: IntakeItemKind): IntakeItemConfig {
  if (kind === "field") {
    return { visible: true, mandatory: false };
  }
  if (kind === "task_type") {
    return {
      mandatory: false,
      default_selected: false,
      generates_runtime_tasks: true,
    };
  }
  if (kind === "task_group") {
    return {
      generates_runtime_tasks: true,
      selection_mode: "multi",
      display_style: "checklist",
    };
  }
  return { allow_other: false };
}
