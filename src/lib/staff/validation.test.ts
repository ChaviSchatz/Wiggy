import { describe, expect, it } from "vitest";

import {
  hasFieldErrors,
  validateStaffInput,
  type StaffInput,
} from "./validation";

function input(overrides: Partial<StaffInput> = {}): StaffInput {
  return {
    fullName: "דנה כהן",
    title: "",
    defaultWorkStageId: "",
    ...overrides,
  };
}

describe("validateStaffInput", () => {
  it("accepts a name alone -- everything else is optional", () => {
    expect(validateStaffInput(input())).toEqual({});
  });

  it("requires a full name", () => {
    expect(validateStaffInput(input({ fullName: "" })).fullName).toBe(
      "required",
    );
  });

  it("treats whitespace as empty", () => {
    expect(validateStaffInput(input({ fullName: "   " })).fullName).toBe(
      "required",
    );
  });

  it("rejects a name longer than the column allows", () => {
    expect(
      validateStaffInput(input({ fullName: "א".repeat(121) })).fullName,
    ).toBe("tooLong");
  });

  it("accepts a name exactly at the limit", () => {
    expect(validateStaffInput(input({ fullName: "א".repeat(120) }))).toEqual(
      {},
    );
  });
});

describe("hasFieldErrors", () => {
  it("is false for a clean result", () => {
    expect(hasFieldErrors({})).toBe(false);
  });

  it("is true once any field failed", () => {
    expect(hasFieldErrors({ fullName: "required" })).toBe(true);
  });
});
