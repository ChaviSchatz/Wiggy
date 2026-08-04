/**
 * Shared, framework-agnostic types for the intake -> runtime-task generation
 * loop (docs/architecture.md §5-§6). No Next.js/Supabase imports here beyond
 * the generated Database row types, so `generate.ts` stays pure and
 * unit-testable without a database.
 */
import type { Tables } from "@/lib/supabase/database.types";

export type IntakeTemplate = Tables<"intake_templates">;
export type IntakeTemplateItemRow = Tables<"intake_template_items">;
export type TaskType = Tables<"task_types">;
export type TaskGroup = Tables<"task_groups">;
export type WorkStage = Tables<"work_stages">;

/** Config JSON shape on `intake_template_items.config` (architecture §4.3). */
export type IntakeItemConfig = {
  mandatory?: boolean;
  visible?: boolean;
  default_selected?: boolean;
  selection_mode?: "single" | "multi" | "all";
  display_style?: "checklist" | "dropdown" | "list";
  section_title?: string;
  help_text?: string;
  generates_runtime_tasks?: boolean;
  allow_other?: boolean;
  other_default_work_stage_id?: string;
};

/**
 * One intake_template_item, resolved with everything the generator needs to
 * act on it: the config JSON typed, and (for task_type/task_group items) the
 * catalog rows required to snapshot values -- no further DB lookups needed
 * once this is built.
 */
export type ResolvedIntakeItem = {
  id: string;
  sortOrder: number;
  itemKind: "task_type" | "task_group" | "field" | "section";
  fieldKey: string | null;
  fieldLabel: string | null;
  fieldType: string | null;
  config: IntakeItemConfig;
  /** Populated when `itemKind === "task_type"`. */
  taskType: TaskType | null;
  /** Populated when `itemKind === "task_group"`; every task type in the group. */
  taskGroupTaskTypes: TaskType[] | null;
};

/**
 * What the user actually did with one intake item in the wizard (Step 3).
 * `otherText` is independent of the primary kind -- `allow_other` can be
 * set on any item (in practice, seeded on `section` items) and captures
 * free text that becomes an "Other" task (ADR 0006) regardless of the
 * item's own kind.
 */
export type ItemResponse = {
  itemId: string;
  /** For `item_kind = field`. */
  fieldValue?: string;
  /** For `item_kind = task_type`: was it selected? */
  taskTypeSelected?: boolean;
  /** For `item_kind = task_group` (ignored when `selection_mode = "all"`). */
  selectedGroupTaskTypeIds?: string[];
  /** Free text for an `allow_other`-flagged item. */
  otherText?: string;
};

/** One entry of the `work_orders.intake_responses` snapshot (ADR 0003). */
export type IntakeResponseEntry = {
  itemId: string;
  label: string;
  value: string;
};

/** A fully resolved runtime task, ready to insert (still needs `sequence_order`). */
export type GeneratedTask = {
  taskTypeId: string | null;
  title: string;
  description: string | null;
  workStageId: string;
  requiresApproval: boolean;
  source: "template" | "other";
  originItemId: string;
  sequenceOrder: number;
};

export type GenerateWorkOrderInput = {
  /** Sorted by `sort_order` ascending. */
  items: ResolvedIntakeItem[];
  responses: ItemResponse[];
  /**
   * Fallback stage for an `allow_other` item with no
   * `config.other_default_work_stage_id` (architecture §6: "fallback: a
   * general stage") -- the stage with the lowest `sort_order`.
   */
  fallbackWorkStageId: string;
  /** `work_stages.sort_order` by id, for sequencing (architecture §6.4). */
  workStageSortOrderById: Record<string, number>;
};

export type GenerateWorkOrderResult = {
  intakeResponses: IntakeResponseEntry[];
  tasks: GeneratedTask[];
};
