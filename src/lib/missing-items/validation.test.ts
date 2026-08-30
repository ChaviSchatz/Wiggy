import { describe, expect, it } from "vitest";

import {
  handledAtFor,
  hasFieldErrors,
  validateMissingItemInput,
  validateMissingItemStatusInput,
} from "./validation";

const validInput = {
  workOrderId: "11111111-1111-1111-1111-111111111111",
  kind: "top",
  description: "טופ 40 ס״מ",
  responsibleStaffMemberId: "",
  notes: "",
};

describe("validateMissingItemInput", () => {
  it("accepts a work order plus a known kind", () => {
    expect(validateMissingItemInput(validInput)).toEqual({});
  });

  it("requires a work order", () => {
    expect(
      validateMissingItemInput({ ...validInput, workOrderId: "  " }),
    ).toEqual({
      workOrderId: "required",
    });
  });

  it("requires a kind", () => {
    expect(validateMissingItemInput({ ...validInput, kind: "" })).toEqual({
      kind: "required",
    });
  });

  it("rejects a kind outside the schema's check constraint", () => {
    expect(validateMissingItemInput({ ...validInput, kind: "lace" })).toEqual({
      kind: "invalid",
    });
  });

  it("treats description and responsible staff member as optional", () => {
    expect(
      validateMissingItemInput({
        ...validInput,
        description: "",
        responsibleStaffMemberId: "",
      }),
    ).toEqual({});
  });
});

describe("validateMissingItemStatusInput", () => {
  it("accepts each status in the lifecycle", () => {
    for (const status of ["open", "found", "ordered", "handled"]) {
      expect(
        validateMissingItemStatusInput({
          status,
          responsibleStaffMemberId: "",
          notes: "",
        }),
      ).toEqual({});
    }
  });

  it("rejects an unknown status", () => {
    expect(
      validateMissingItemStatusInput({
        status: "lost",
        responsibleStaffMemberId: "",
        notes: "",
      }),
    ).toEqual({ status: "invalid" });
  });

  it("requires a status", () => {
    expect(
      validateMissingItemStatusInput({
        status: "",
        responsibleStaffMemberId: "",
        notes: "",
      }),
    ).toEqual({ status: "required" });
  });
});

describe("handledAtFor", () => {
  const now = new Date("2026-08-19T09:00:00.000Z");

  it("stamps the handling time when the item becomes handled", () => {
    expect(handledAtFor("handled", null, now)).toBe("2026-08-19T09:00:00.000Z");
  });

  it("keeps the original handling time when an already-handled item is re-saved", () => {
    expect(handledAtFor("handled", "2026-08-01T07:00:00.000Z", now)).toBe(
      "2026-08-01T07:00:00.000Z",
    );
  });

  it("clears the handling time when a handled item is reopened", () => {
    expect(handledAtFor("open", "2026-08-01T07:00:00.000Z", now)).toBeNull();
  });

  it.each(["open", "found", "ordered"] as const)(
    "leaves %s unstamped",
    (status) => {
      expect(handledAtFor(status, null, now)).toBeNull();
    },
  );
});

describe("hasFieldErrors", () => {
  it("is false for an empty error object", () => {
    expect(hasFieldErrors({})).toBe(false);
  });

  it("is true once any field failed", () => {
    expect(hasFieldErrors({ kind: "invalid" })).toBe(true);
  });
});
