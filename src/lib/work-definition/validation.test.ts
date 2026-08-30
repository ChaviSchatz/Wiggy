import { describe, expect, it } from "vitest";

import {
  WORK_ORDER_KINDS,
  hasTemplateErrors,
  isWorkOrderKind,
  validateItemInput,
  validateTemplateInput,
  type ItemInput,
  type TemplateInput,
} from "./validation";

function template(overrides: Partial<TemplateInput> = {}): TemplateInput {
  return {
    name: "תיקון פאה",
    workOrderKind: "repair",
    description: "",
    ...overrides,
  };
}

function item(overrides: Partial<ItemInput> = {}): ItemInput {
  return {
    itemKind: "field",
    fieldLabel: "אורך",
    fieldKey: "",
    fieldType: "text",
    optionsText: "",
    sectionTitle: "",
    ...overrides,
  };
}

describe("WORK_ORDER_KINDS", () => {
  it("matches the five values the schema and message catalog define", () => {
    expect([...WORK_ORDER_KINDS]).toEqual([
      "customer",
      "display_wig",
      "internal",
      "missing_item",
      "repair",
    ]);
  });
});

describe("isWorkOrderKind", () => {
  it("rejects a tenant-invented kind, which would render as a raw key", () => {
    expect(isWorkOrderKind("repair")).toBe(true);
    expect(isWorkOrderKind("wig_repair")).toBe(false);
  });
});

describe("validateTemplateInput", () => {
  it("accepts a name and a known kind", () => {
    expect(validateTemplateInput(template())).toEqual({});
  });

  it("requires a name", () => {
    expect(validateTemplateInput(template({ name: "  " })).name).toBe(
      "required",
    );
  });

  it("rejects an unknown kind", () => {
    expect(
      validateTemplateInput(template({ workOrderKind: "nope" })).workOrderKind,
    ).toBe("invalid");
  });
});

describe("validateItemInput", () => {
  it("requires a label on a field, but not a key", () => {
    expect(validateItemInput(item())).toEqual({});
    expect(validateItemInput(item({ fieldLabel: " " })).fieldLabel).toBe(
      "required",
    );
  });

  it("rejects an unknown field type", () => {
    expect(validateItemInput(item({ fieldType: "number" })).fieldType).toBe(
      "invalid",
    );
  });

  it("requires at least one option for a select", () => {
    expect(validateItemInput(item({ fieldType: "select" })).options).toBe(
      "required",
    );
    expect(
      validateItemInput(item({ fieldType: "select", optionsText: "  \n " }))
        .options,
    ).toBe("required");
    expect(
      validateItemInput(item({ fieldType: "select", optionsText: "קצר" })),
    ).toEqual({});
  });

  it("ignores options for non-select types", () => {
    expect(
      validateItemInput(item({ fieldType: "text", optionsText: "" })),
    ).toEqual({});
  });

  it("requires a title on a section", () => {
    expect(
      validateItemInput(item({ itemKind: "section", sectionTitle: "פרטים" })),
    ).toEqual({});
    expect(
      validateItemInput(item({ itemKind: "section", sectionTitle: "" }))
        .sectionTitle,
    ).toBe("required");
  });

  it("has nothing to validate on task_type and task_group items", () => {
    // The referent is picked from the catalog, not typed in.
    expect(validateItemInput(item({ itemKind: "task_type" }))).toEqual({});
    expect(validateItemInput(item({ itemKind: "task_group" }))).toEqual({});
  });
});

describe("hasTemplateErrors", () => {
  it("is false when clean and true once any field failed", () => {
    expect(hasTemplateErrors({})).toBe(false);
    expect(hasTemplateErrors({ name: "required" })).toBe(true);
  });
});
