/**
 * Runtime-task generation algorithm (docs/architecture.md §5-§6, ADR 0003,
 * ADR 0006). Pure and framework-agnostic: no Next.js, no Supabase client --
 * takes fully-resolved catalog data in, returns the snapshot + task list to
 * insert. The DB-touching adapter lives in `actions.ts`.
 *
 * Algorithm (confirm intake, §6):
 * 1. Walk intake_template_items in sort_order.
 * 2. For each item:
 *    - field/section -> structured data on `intake_responses` (never a task).
 *    - task_type (selected) -> one runtime task.
 *    - task_group -> one runtime task per selected task type
 *      (`selection_mode = "all"` means every type in the group).
 *    - `allow_other` + filled-in free text (any item kind) -> a task with
 *      `task_type_id = null`, `source = "other"` (ADR 0006), always
 *      generated regardless of the item's own kind.
 * 3. Resolve each task's snapshot via the three-layer defaulting (§5.2):
 *    TaskType default -> IntakeTemplateItem override -> frozen snapshot.
 *    The current `config` schema (architecture §4.3) exposes no per-item
 *    override for stage/approval on task_type/task_group items, so layer 2
 *    is a documented no-op for those today; `other_default_work_stage_id`
 *    is the one override that exists, for "Other" items specifically.
 * 4. Sequence by `work_stage.sort_order`, tie-broken by item order (§6.4).
 * 5. A `field` item carrying `config.missing_item_kind` ("no top / no skin")
 *    additionally yields a `missing_items` row when it was answered (§6.5) --
 *    structured data *and* a tracked item, never a task.
 */
// Relative, with the extension, unlike the rest of the codebase's `@/` imports:
// this module is imported directly by the seed scripts, which run in plain Node
// and can't resolve the alias for a *value* import (see AGENTS.md).
import { isMissingItemKind } from "../missing-items/validation.ts";
import type {
  GenerateWorkOrderInput,
  GenerateWorkOrderResult,
  GeneratedMissingItem,
  GeneratedTask,
  IntakeResponseEntry,
  ResolvedIntakeItem,
} from "./types";

export function generateWorkOrder(
  input: GenerateWorkOrderInput,
): GenerateWorkOrderResult {
  const responseByItemId = new Map(
    input.responses.map((response) => [response.itemId, response] as const),
  );

  const intakeResponses: IntakeResponseEntry[] = [];
  const tasks: GeneratedTask[] = [];
  const missingItems: GeneratedMissingItem[] = [];

  for (const item of input.items) {
    const response = responseByItemId.get(item.id);

    collectFieldResponse(item, response, intakeResponses);
    collectMissingItemFlag(item, response, missingItems);
    collectOtherResponse(
      item,
      response,
      input.fallbackWorkStageId,
      intakeResponses,
      tasks,
    );
    collectTaskTypeSelection(item, response, tasks);
    collectTaskGroupSelection(item, response, tasks);
  }

  return {
    intakeResponses,
    tasks: sequenceTasks(tasks, input.workStageSortOrderById),
    missingItems,
  };
}

function collectFieldResponse(
  item: ResolvedIntakeItem,
  response: { fieldValue?: string } | undefined,
  intakeResponses: IntakeResponseEntry[],
) {
  if (item.itemKind !== "field") return;
  const value = response?.fieldValue?.trim();
  if (!value) return;

  intakeResponses.push({
    itemId: item.id,
    label: item.fieldLabel ?? item.fieldKey ?? item.id,
    value,
  });
}

/**
 * "No top / no skin" intake flags (§6.5). Only `field` items qualify: the
 * answer is what marks the item as missing, so there has to be an answer to
 * read. `config` is tenant data, so an unrecognised kind is dropped rather
 * than carried into an insert the check constraint would reject.
 */
function collectMissingItemFlag(
  item: ResolvedIntakeItem,
  response: { fieldValue?: string } | undefined,
  missingItems: GeneratedMissingItem[],
) {
  if (item.itemKind !== "field") return;

  const kind = item.config.missing_item_kind;
  if (!kind || !isMissingItemKind(kind)) return;
  if (!response?.fieldValue?.trim()) return;

  missingItems.push({
    kind,
    description: item.fieldLabel ?? item.fieldKey ?? null,
    originItemId: item.id,
  });
}

function collectOtherResponse(
  item: ResolvedIntakeItem,
  response: { otherText?: string } | undefined,
  fallbackWorkStageId: string,
  intakeResponses: IntakeResponseEntry[],
  tasks: GeneratedTask[],
) {
  if (!item.config.allow_other) return;
  const value = response?.otherText?.trim();
  if (!value) return;

  intakeResponses.push({
    itemId: item.id,
    label: item.config.section_title ?? item.fieldLabel ?? item.id,
    value,
  });

  tasks.push({
    taskTypeId: null,
    title: value,
    description: null,
    workStageId: item.config.other_default_work_stage_id ?? fallbackWorkStageId,
    requiresApproval: false,
    source: "other",
    originItemId: item.id,
    sequenceOrder: 0,
  });
}

function collectTaskTypeSelection(
  item: ResolvedIntakeItem,
  response: { taskTypeSelected?: boolean } | undefined,
  tasks: GeneratedTask[],
) {
  if (item.itemKind !== "task_type" || !item.taskType) return;
  if (!response?.taskTypeSelected) return;

  tasks.push(taskFromTaskType(item.taskType, item.id));
}

function collectTaskGroupSelection(
  item: ResolvedIntakeItem,
  response: { selectedGroupTaskTypeIds?: string[] } | undefined,
  tasks: GeneratedTask[],
) {
  if (item.itemKind !== "task_group" || !item.taskGroupTaskTypes) return;

  const selectedIds =
    item.config.selection_mode === "all"
      ? item.taskGroupTaskTypes.map((taskType) => taskType.id)
      : (response?.selectedGroupTaskTypeIds ?? []);

  for (const taskTypeId of selectedIds) {
    const taskType = item.taskGroupTaskTypes.find((t) => t.id === taskTypeId);
    if (taskType) tasks.push(taskFromTaskType(taskType, item.id));
  }
}

/** Three-layer defaulting, layer 1 -> 3 (layer 2 is a no-op today, see header). */
function taskFromTaskType(
  taskType: NonNullable<ResolvedIntakeItem["taskType"]>,
  originItemId: string,
): GeneratedTask {
  return {
    taskTypeId: taskType.id,
    title: taskType.name,
    description: taskType.description,
    workStageId: taskType.default_work_stage_id,
    requiresApproval: taskType.requires_approval_default,
    source: "template",
    originItemId,
    sequenceOrder: 0,
  };
}

function sequenceTasks(
  tasks: GeneratedTask[],
  workStageSortOrderById: Record<string, number>,
): GeneratedTask[] {
  return tasks
    .map((task, originalIndex) => ({ task, originalIndex }))
    .sort((a, b) => {
      const stageDiff =
        (workStageSortOrderById[a.task.workStageId] ?? 0) -
        (workStageSortOrderById[b.task.workStageId] ?? 0);
      return stageDiff !== 0 ? stageDiff : a.originalIndex - b.originalIndex;
    })
    .map(({ task }, sequenceOrder) => ({ ...task, sequenceOrder }));
}
