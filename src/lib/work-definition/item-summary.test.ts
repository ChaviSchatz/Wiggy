import { describe, expect, it } from "vitest";

import { itemSummary } from "./item-summary";
import type { IntakeItemKind } from "./validation";

function summary(kind: IntakeItemKind, config: Record<string, unknown> = {}) {
  return itemSummary(kind, config);
}

function keys(kind: IntakeItemKind, config: Record<string, unknown> = {}) {
  return summary(kind, config).map((entry) => entry.messageKey);
}

describe("itemSummary", () => {
  it("says nothing about a plain question", () => {
    // The rendered control already shows everything there is to know.
    expect(summary("field", { visible: true })).toEqual([]);
  });

  it("flags a required question", () => {
    expect(keys("field", { mandatory: true })).toEqual(["mandatory"]);
  });

  it("warns about a missing-stock flag, which looks like any other question", () => {
    const entries = summary("field", { missing_item_kind: "top" });

    expect(entries).toHaveLength(1);
    expect(entries[0]).toEqual({ messageKey: "missingItem", tone: "warning" });
  });

  it("reports a hidden question, since it renders but never appears", () => {
    expect(keys("field", { visible: false })).toEqual(["hidden"]);
  });

  it("describes a task that is pre-selected and generates work", () => {
    expect(
      keys("task_type", {
        default_selected: true,
        generates_runtime_tasks: true,
      }),
    ).toEqual(["defaultSelected", "generatesTasks"]);
  });

  it("describes a group's selection mode and that each pick becomes a task", () => {
    expect(
      keys("task_group", {
        selection_mode: "multi",
        generates_runtime_tasks: true,
      }),
    ).toEqual(["selectionMode.multi", "generatesTasks"]);
  });

  it("warns when a task or group generates nothing", () => {
    // Legal but almost always a mistake -- the selection would do nothing.
    const entries = summary("task_type", { generates_runtime_tasks: false });

    expect(entries).toContainEqual({
      messageKey: "generatesNothing",
      tone: "warning",
    });
  });

  it("reports a section that allows free text", () => {
    expect(keys("section", { allow_other: true })).toEqual(["allowOther"]);
  });

  it("says nothing about a plain section", () => {
    expect(summary("section", { section_title: "פרטים" })).toEqual([]);
  });

  it("keeps warnings ahead of neutral notes", () => {
    const entries = summary("field", {
      mandatory: true,
      missing_item_kind: "skin",
    });

    expect(entries.map((e) => e.tone)).toEqual(["warning", "muted"]);
  });
});
