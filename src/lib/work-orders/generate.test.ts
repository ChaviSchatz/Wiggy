import { describe, expect, it } from "vitest";

import { generateWorkOrder } from "./generate";
import type {
  GenerateWorkOrderInput,
  IntakeItemConfig,
  ItemResponse,
  ResolvedIntakeItem,
  TaskType,
} from "./types";

function taskType(
  overrides: Partial<TaskType> & { id: string; name: string },
): TaskType {
  return {
    business_id: "biz-1",
    description: null,
    default_work_stage_id: "stage-generic",
    default_staff_member_id: null,
    default_duration_minutes: null,
    requires_approval_default: false,
    instructions: null,
    sort_order: 0,
    is_active: true,
    created_at: "",
    updated_at: "",
    ...overrides,
  };
}

function item(
  overrides: Partial<ResolvedIntakeItem> & {
    id: string;
    sortOrder: number;
    itemKind: ResolvedIntakeItem["itemKind"];
  },
): ResolvedIntakeItem {
  return {
    fieldKey: null,
    fieldLabel: null,
    fieldType: null,
    options: [],
    config: {},
    taskType: null,
    taskGroupTaskTypes: null,
    ...overrides,
  };
}

function config(overrides: IntakeItemConfig): IntakeItemConfig {
  return overrides;
}

function baseInput(
  overrides: Partial<GenerateWorkOrderInput> & { items: ResolvedIntakeItem[] },
): GenerateWorkOrderInput {
  return {
    responses: [],
    fallbackWorkStageId: "stage-intake",
    workStageSortOrderById: {},
    ...overrides,
  };
}

describe("generateWorkOrder", () => {
  it("saves a filled field as structured intake_responses data, never a task", () => {
    const items = [
      item({
        id: "item-1",
        sortOrder: 0,
        itemKind: "field",
        fieldKey: "desired_style",
        fieldLabel: "סטייל רצוי",
      }),
    ];
    const responses: ItemResponse[] = [
      { itemId: "item-1", fieldValue: "  בלורד  " },
    ];

    const result = generateWorkOrder(baseInput({ items, responses }));

    expect(result.tasks).toEqual([]);
    expect(result.intakeResponses).toEqual([
      { itemId: "item-1", label: "סטייל רצוי", value: "בלורד" },
    ]);
  });

  it("omits a field from intake_responses when left blank", () => {
    const items = [
      item({
        id: "item-1",
        sortOrder: 0,
        itemKind: "field",
        fieldLabel: "הערות",
      }),
    ];
    const responses: ItemResponse[] = [{ itemId: "item-1", fieldValue: "   " }];

    const result = generateWorkOrder(baseInput({ items, responses }));

    expect(result.intakeResponses).toEqual([]);
  });

  it("falls back to field_key, then item id, as the intake_responses label", () => {
    const items = [
      item({
        id: "item-1",
        sortOrder: 0,
        itemKind: "field",
        fieldKey: "notes_key",
      }),
      item({ id: "item-2", sortOrder: 1, itemKind: "field" }),
    ];
    const responses: ItemResponse[] = [
      { itemId: "item-1", fieldValue: "a" },
      { itemId: "item-2", fieldValue: "b" },
    ];

    const result = generateWorkOrder(baseInput({ items, responses }));

    expect(result.intakeResponses).toEqual([
      { itemId: "item-1", label: "notes_key", value: "a" },
      { itemId: "item-2", label: "item-2", value: "b" },
    ]);
  });

  it("creates a runtime task for a selected task_type item", () => {
    const hairWash = taskType({
      id: "tt-wash",
      name: "שטיפה",
      default_work_stage_id: "stage-wash",
    });
    const items = [
      item({
        id: "item-1",
        sortOrder: 0,
        itemKind: "task_type",
        taskType: hairWash,
      }),
    ];
    const responses: ItemResponse[] = [
      { itemId: "item-1", taskTypeSelected: true },
    ];

    const result = generateWorkOrder(
      baseInput({
        items,
        responses,
        workStageSortOrderById: { "stage-wash": 0 },
      }),
    );

    expect(result.tasks).toEqual([
      {
        taskTypeId: "tt-wash",
        title: "שטיפה",
        description: null,
        workStageId: "stage-wash",
        requiresApproval: false,
        source: "template",
        originItemId: "item-1",
        sequenceOrder: 0,
      },
    ]);
  });

  it("does not create a task for an unselected task_type item", () => {
    const items = [
      item({
        id: "item-1",
        sortOrder: 0,
        itemKind: "task_type",
        taskType: taskType({ id: "tt-1", name: "X" }),
      }),
    ];

    const result = generateWorkOrder(baseInput({ items, responses: [] }));

    expect(result.tasks).toEqual([]);
  });

  it("snapshots requires_approval_default and description from the task type", () => {
    const approved = taskType({
      id: "tt-color",
      name: "צבע מלא",
      description: "צביעה מלאה של הפאה",
      requires_approval_default: true,
      default_work_stage_id: "stage-color",
    });
    const items = [
      item({
        id: "item-1",
        sortOrder: 0,
        itemKind: "task_type",
        taskType: approved,
      }),
    ];
    const responses: ItemResponse[] = [
      { itemId: "item-1", taskTypeSelected: true },
    ];

    const result = generateWorkOrder(baseInput({ items, responses }));

    expect(result.tasks[0]).toMatchObject({
      description: "צביעה מלאה של הפאה",
      requiresApproval: true,
      workStageId: "stage-color",
    });
  });

  it("creates one task per selected task type in a multi-select task_group", () => {
    const roots = taskType({
      id: "tt-roots",
      name: "שורשים",
      default_work_stage_id: "stage-color",
    });
    const highlights = taskType({
      id: "tt-highlights",
      name: "הדגשות",
      default_work_stage_id: "stage-color",
    });
    const fullColor = taskType({
      id: "tt-full",
      name: "צבע מלא",
      default_work_stage_id: "stage-color",
    });
    const items = [
      item({
        id: "item-1",
        sortOrder: 0,
        itemKind: "task_group",
        config: config({ selection_mode: "multi" }),
        taskGroupTaskTypes: [fullColor, roots, highlights],
      }),
    ];
    const responses: ItemResponse[] = [
      {
        itemId: "item-1",
        selectedGroupTaskTypeIds: ["tt-roots", "tt-highlights"],
      },
    ];

    const result = generateWorkOrder(baseInput({ items, responses }));

    expect(result.tasks.map((t) => t.taskTypeId).sort()).toEqual(
      ["tt-highlights", "tt-roots"].sort(),
    );
  });

  it("includes every task type in a task_group when selection_mode is 'all', ignoring the response", () => {
    const wash = taskType({ id: "tt-wash", name: "שטיפה" });
    const styling = taskType({ id: "tt-styling", name: "עיצוב" });
    const items = [
      item({
        id: "item-1",
        sortOrder: 0,
        itemKind: "task_group",
        config: config({ selection_mode: "all" }),
        taskGroupTaskTypes: [wash, styling],
      }),
    ];

    const result = generateWorkOrder(baseInput({ items, responses: [] }));

    expect(result.tasks.map((t) => t.taskTypeId).sort()).toEqual(
      ["tt-styling", "tt-wash"].sort(),
    );
  });

  it("creates no tasks for an empty task_group selection", () => {
    const items = [
      item({
        id: "item-1",
        sortOrder: 0,
        itemKind: "task_group",
        config: config({ selection_mode: "multi" }),
        taskGroupTaskTypes: [taskType({ id: "tt-1", name: "X" })],
      }),
    ];

    const result = generateWorkOrder(
      baseInput({
        items,
        responses: [{ itemId: "item-1", selectedGroupTaskTypeIds: [] }],
      }),
    );

    expect(result.tasks).toEqual([]);
  });

  it("generates an 'Other' task from free text on an allow_other item (ADR 0006)", () => {
    const items = [
      item({
        id: "item-1",
        sortOrder: 0,
        itemKind: "section",
        config: config({
          section_title: "עבודה נוספת",
          allow_other: true,
          other_default_work_stage_id: "stage-planning",
        }),
      }),
    ];
    const responses: ItemResponse[] = [
      { itemId: "item-1", otherText: "  לתקן קרע קטן בקדמת הפאה  " },
    ];

    const result = generateWorkOrder(baseInput({ items, responses }));

    expect(result.tasks).toEqual([
      {
        taskTypeId: null,
        title: "לתקן קרע קטן בקדמת הפאה",
        description: null,
        workStageId: "stage-planning",
        requiresApproval: false,
        source: "other",
        originItemId: "item-1",
        sequenceOrder: 0,
      },
    ]);
    expect(result.intakeResponses).toEqual([
      {
        itemId: "item-1",
        label: "עבודה נוספת",
        value: "לתקן קרע קטן בקדמת הפאה",
      },
    ]);
  });

  it("falls back to the given fallback stage when other_default_work_stage_id is missing", () => {
    const items = [
      item({
        id: "item-1",
        sortOrder: 0,
        itemKind: "section",
        config: config({ allow_other: true }),
      }),
    ];
    const responses: ItemResponse[] = [{ itemId: "item-1", otherText: "משהו" }];

    const result = generateWorkOrder(
      baseInput({ items, responses, fallbackWorkStageId: "stage-fallback" }),
    );

    expect(result.tasks[0].workStageId).toBe("stage-fallback");
  });

  it("does not generate an Other task when allow_other is set but no text was entered", () => {
    const items = [
      item({
        id: "item-1",
        sortOrder: 0,
        itemKind: "section",
        config: config({ allow_other: true }),
      }),
    ];

    const result = generateWorkOrder(baseInput({ items, responses: [] }));

    expect(result.tasks).toEqual([]);
    expect(result.intakeResponses).toEqual([]);
  });

  it("never generates a task from a plain section or field, even without allow_other", () => {
    const items = [
      item({
        id: "item-1",
        sortOrder: 0,
        itemKind: "section",
        config: config({ section_title: "פרטי הזמנה" }),
      }),
      item({
        id: "item-2",
        sortOrder: 1,
        itemKind: "field",
        fieldLabel: "הערה",
      }),
    ];
    const responses: ItemResponse[] = [
      { itemId: "item-2", fieldValue: "טקסט" },
    ];

    const result = generateWorkOrder(baseInput({ items, responses }));

    expect(result.tasks).toEqual([]);
  });

  it("sequences tasks by work_stage sort_order, tie-broken by item order", () => {
    const items = [
      item({
        id: "item-late-stage",
        sortOrder: 0,
        itemKind: "task_type",
        taskType: taskType({
          id: "tt-final",
          name: "ביקורת סופית",
          default_work_stage_id: "stage-final",
        }),
      }),
      item({
        id: "item-early-stage-a",
        sortOrder: 1,
        itemKind: "task_type",
        taskType: taskType({
          id: "tt-wash-a",
          name: "שטיפה א",
          default_work_stage_id: "stage-wash",
        }),
      }),
      item({
        id: "item-early-stage-b",
        sortOrder: 2,
        itemKind: "task_type",
        taskType: taskType({
          id: "tt-wash-b",
          name: "שטיפה ב",
          default_work_stage_id: "stage-wash",
        }),
      }),
    ];
    const responses: ItemResponse[] = items.map((i) => ({
      itemId: i.id,
      taskTypeSelected: true,
    }));

    const result = generateWorkOrder(
      baseInput({
        items,
        responses,
        workStageSortOrderById: { "stage-wash": 0, "stage-final": 5 },
      }),
    );

    // Both wash tasks (stage sort_order 0) come before final review (5);
    // within the same stage, original item order wins (a before b).
    expect(result.tasks.map((t) => t.taskTypeId)).toEqual([
      "tt-wash-a",
      "tt-wash-b",
      "tt-final",
    ]);
    expect(result.tasks.map((t) => t.sequenceOrder)).toEqual([0, 1, 2]);
  });

  it("treats a stage missing from workStageSortOrderById as sort_order 0", () => {
    const items = [
      item({
        id: "item-1",
        sortOrder: 0,
        itemKind: "task_type",
        taskType: taskType({
          id: "tt-1",
          name: "A",
          default_work_stage_id: "stage-unknown",
        }),
      }),
      item({
        id: "item-2",
        sortOrder: 1,
        itemKind: "task_type",
        taskType: taskType({
          id: "tt-2",
          name: "B",
          default_work_stage_id: "stage-known",
        }),
      }),
    ];
    const responses: ItemResponse[] = [
      { itemId: "item-1", taskTypeSelected: true },
      { itemId: "item-2", taskTypeSelected: true },
    ];

    const result = generateWorkOrder(
      baseInput({
        items,
        responses,
        workStageSortOrderById: { "stage-known": -1 },
      }),
    );

    // stage-known has sort_order -1 (before the implicit 0 of stage-unknown).
    expect(result.tasks.map((t) => t.taskTypeId)).toEqual(["tt-2", "tt-1"]);
  });

  it("flags a missing item when a missing_item_kind field is answered", () => {
    const items = [
      item({
        id: "item-no-top",
        sortOrder: 0,
        itemKind: "field",
        fieldKey: "no_top",
        fieldLabel: "אין טופ במלאי",
        fieldType: "boolean",
        config: config({ missing_item_kind: "top" }),
      }),
    ];
    const responses: ItemResponse[] = [
      { itemId: "item-no-top", fieldValue: "כן" },
    ];

    const result = generateWorkOrder(baseInput({ items, responses }));

    expect(result.missingItems).toEqual([
      {
        kind: "top",
        description: "אין טופ במלאי",
        originItemId: "item-no-top",
      },
    ]);
    // The flag is still structured intake data, and never a task (ADR 0003).
    expect(result.intakeResponses).toEqual([
      { itemId: "item-no-top", label: "אין טופ במלאי", value: "כן" },
    ]);
    expect(result.tasks).toEqual([]);
  });

  it("creates no missing item when the flag is left unanswered", () => {
    const items = [
      item({
        id: "item-no-top",
        sortOrder: 0,
        itemKind: "field",
        fieldLabel: "אין טופ במלאי",
        config: config({ missing_item_kind: "top" }),
      }),
    ];

    const result = generateWorkOrder(
      baseInput({
        items,
        responses: [{ itemId: "item-no-top", fieldValue: "   " }],
      }),
    );

    expect(result.missingItems).toEqual([]);
  });

  it("flags one missing item per answered flag", () => {
    const items = [
      item({
        id: "item-no-top",
        sortOrder: 0,
        itemKind: "field",
        fieldLabel: "אין טופ במלאי",
        config: config({ missing_item_kind: "top" }),
      }),
      item({
        id: "item-no-skin",
        sortOrder: 1,
        itemKind: "field",
        fieldLabel: "אין עור במלאי",
        config: config({ missing_item_kind: "skin" }),
      }),
    ];
    const responses: ItemResponse[] = [
      { itemId: "item-no-top", fieldValue: "כן" },
      { itemId: "item-no-skin", fieldValue: "כן" },
    ];

    const result = generateWorkOrder(baseInput({ items, responses }));

    expect(result.missingItems.map((missing) => missing.kind)).toEqual([
      "top",
      "skin",
    ]);
  });

  it("ignores a missing_item_kind the schema wouldn't accept", () => {
    const items = [
      item({
        id: "item-1",
        sortOrder: 0,
        itemKind: "field",
        fieldLabel: "אין תחרה",
        // Config is tenant data (jsonb), so a typo must not reach the insert.
        config: { missing_item_kind: "lace" } as never,
      }),
    ];

    const result = generateWorkOrder(
      baseInput({ items, responses: [{ itemId: "item-1", fieldValue: "כן" }] }),
    );

    expect(result.missingItems).toEqual([]);
  });

  it("falls back to field_key as the missing item's description", () => {
    const items = [
      item({
        id: "item-1",
        sortOrder: 0,
        itemKind: "field",
        fieldKey: "no_skin",
        config: config({ missing_item_kind: "skin" }),
      }),
    ];

    const result = generateWorkOrder(
      baseInput({ items, responses: [{ itemId: "item-1", fieldValue: "כן" }] }),
    );

    expect(result.missingItems[0].description).toBe("no_skin");
  });

  it("only treats field items as missing-item flags", () => {
    const items = [
      item({
        id: "section-1",
        sortOrder: 0,
        itemKind: "section",
        config: config({ missing_item_kind: "top", section_title: "מלאי" }),
      }),
    ];

    const result = generateWorkOrder(
      baseInput({
        items,
        responses: [{ itemId: "section-1", fieldValue: "כן" }],
      }),
    );

    expect(result.missingItems).toEqual([]);
  });

  it("reproduces the seeded 'New Wig' template shape end to end", () => {
    const stageColor = "stage-color";
    const stageHandTying = "stage-hand-tying";
    const stageWashStyling = "stage-wash-styling";
    const stagePlanning = "stage-planning";

    const fullColor = taskType({
      id: "tt-full-color",
      name: "צבע מלא",
      default_work_stage_id: stageColor,
    });
    const roots = taskType({
      id: "tt-roots",
      name: "שורשים",
      default_work_stage_id: stageColor,
    });
    const highlights = taskType({
      id: "tt-highlights",
      name: "הדגשות",
      default_work_stage_id: stageColor,
    });
    const handTying = taskType({
      id: "tt-hand-tying",
      name: "קשירה ידנית",
      default_work_stage_id: stageHandTying,
      requires_approval_default: true,
    });
    const wash = taskType({
      id: "tt-wash",
      name: "שטיפה",
      default_work_stage_id: stageWashStyling,
    });
    const styling = taskType({
      id: "tt-styling",
      name: "עיצוב",
      default_work_stage_id: stageWashStyling,
    });

    const items: ResolvedIntakeItem[] = [
      item({
        id: "section-details",
        sortOrder: 0,
        itemKind: "section",
        config: config({ section_title: "פרטי ההזמנה" }),
      }),
      item({
        id: "field-style",
        sortOrder: 1,
        itemKind: "field",
        fieldKey: "desired_style",
        fieldLabel: "סטייל רצוי",
      }),
      item({
        id: "field-notes",
        sortOrder: 2,
        itemKind: "field",
        fieldKey: "special_instructions",
        fieldLabel: "הערות מיוחדות",
      }),
      item({
        id: "group-color",
        sortOrder: 3,
        itemKind: "task_group",
        config: config({ selection_mode: "multi" }),
        taskGroupTaskTypes: [fullColor, roots, highlights],
      }),
      item({
        id: "task-hand-tying",
        sortOrder: 4,
        itemKind: "task_type",
        taskType: handTying,
      }),
      item({
        id: "group-wash",
        sortOrder: 5,
        itemKind: "task_group",
        config: config({ selection_mode: "multi" }),
        taskGroupTaskTypes: [wash, styling],
      }),
      item({
        id: "section-other",
        sortOrder: 6,
        itemKind: "section",
        config: config({
          section_title: "עבודה נוספת",
          allow_other: true,
          other_default_work_stage_id: stagePlanning,
        }),
      }),
    ];

    const responses: ItemResponse[] = [
      { itemId: "field-style", fieldValue: "בלורד ארוך" },
      { itemId: "group-color", selectedGroupTaskTypeIds: ["tt-full-color"] },
      { itemId: "task-hand-tying", taskTypeSelected: true },
      {
        itemId: "group-wash",
        selectedGroupTaskTypeIds: ["tt-wash", "tt-styling"],
      },
      { itemId: "section-other", otherText: "לבדוק התאמת קסדה" },
    ];

    const result = generateWorkOrder(
      baseInput({
        items,
        responses,
        fallbackWorkStageId: stagePlanning,
        workStageSortOrderById: {
          [stagePlanning]: 1,
          [stageHandTying]: 3,
          [stageColor]: 4,
          [stageWashStyling]: 5,
        },
      }),
    );

    expect(result.intakeResponses).toEqual([
      { itemId: "field-style", label: "סטייל רצוי", value: "בלורד ארוך" },
      {
        itemId: "section-other",
        label: "עבודה נוספת",
        value: "לבדוק התאמת קסדה",
      },
    ]);

    // special_instructions was left blank -> no entry; notes item never a task.
    expect(
      result.intakeResponses.some((entry) => entry.itemId === "field-notes"),
    ).toBe(false);

    // 4 template tasks (1 color + 1 hand-tying + 2 wash/styling) + 1 other task.
    expect(result.tasks).toHaveLength(5);
    // Sorted by work_stage sort_order: planning (1) < hand_tying (3) <
    // color (4) < wash_styling (5); within wash_styling, item order (wash
    // before styling) breaks the tie.
    expect(result.tasks.map((t) => t.title)).toEqual([
      "לבדוק התאמת קסדה",
      "קשירה ידנית",
      "צבע מלא",
      "שטיפה",
      "עיצוב",
    ]);
    expect(result.tasks.find((t) => t.title === "קשירה ידנית")).toMatchObject({
      requiresApproval: true,
      source: "template",
    });
    expect(result.tasks.find((t) => t.source === "other")).toMatchObject({
      taskTypeId: null,
      workStageId: stagePlanning,
    });
    expect(result.tasks.map((t) => t.sequenceOrder)).toEqual([0, 1, 2, 3, 4]);
  });
});
