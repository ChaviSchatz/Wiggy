import { describe, expect, it } from "vitest";

import {
  FIELD_TYPES,
  isFieldType,
  parseOptions,
  requiresOptions,
  serializeOptions,
} from "./field-types";

describe("FIELD_TYPES", () => {
  it("is the whole vocabulary the intake form can render", () => {
    expect([...FIELD_TYPES]).toEqual(["text", "textarea", "boolean", "select"]);
  });
});

describe("isFieldType", () => {
  it("accepts every member", () => {
    for (const type of FIELD_TYPES) expect(isFieldType(type)).toBe(true);
  });

  it("rejects anything else, including null from the nullable column", () => {
    expect(isFieldType("number")).toBe(false);
    expect(isFieldType("")).toBe(false);
    expect(isFieldType(null)).toBe(false);
    expect(isFieldType(undefined)).toBe(false);
  });
});

describe("requiresOptions", () => {
  it("is true only for select", () => {
    expect(requiresOptions("select")).toBe(true);
    expect(requiresOptions("text")).toBe(false);
    expect(requiresOptions("textarea")).toBe(false);
    expect(requiresOptions("boolean")).toBe(false);
  });
});

describe("parseOptions", () => {
  it("reads a string array out of the options jsonb", () => {
    expect(parseOptions(["קצר", "בינוני"])).toEqual(["קצר", "בינוני"]);
  });

  it("returns empty for anything that is not a string array", () => {
    // `options` is untyped jsonb, so tenant data can be any shape.
    expect(parseOptions(null)).toEqual([]);
    expect(parseOptions(undefined)).toEqual([]);
    expect(parseOptions("קצר")).toEqual([]);
    expect(parseOptions({ a: 1 })).toEqual([]);
  });

  it("drops non-string and blank entries rather than rendering them", () => {
    expect(parseOptions(["קצר", 3, "", "  ", "ארוך"])).toEqual(["קצר", "ארוך"]);
  });
});

describe("serializeOptions", () => {
  it("turns one-per-line textarea input into a trimmed array", () => {
    expect(serializeOptions("קצר\nבינוני\nארוך")).toEqual([
      "קצר",
      "בינוני",
      "ארוך",
    ]);
  });

  it("drops blank lines and trims whitespace", () => {
    expect(serializeOptions("  קצר  \n\n\n ארוך \n")).toEqual(["קצר", "ארוך"]);
  });

  it("returns empty for empty input", () => {
    expect(serializeOptions("")).toEqual([]);
    expect(serializeOptions("   \n  ")).toEqual([]);
  });
});
