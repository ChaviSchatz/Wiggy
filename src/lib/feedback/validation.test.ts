import { describe, expect, it } from "vitest";

import {
  FEEDBACK_MESSAGE_MAX_LENGTH,
  hasFieldErrors,
  validateFeedbackInput,
} from "./validation";

describe("validateFeedbackInput", () => {
  it("accepts each of the three feedback kinds with a message", () => {
    for (const kind of ["bug", "feature", "question"]) {
      expect(validateFeedbackInput({ kind, message: "לא נטען" })).toEqual({});
    }
  });

  it("requires a message", () => {
    expect(validateFeedbackInput({ kind: "bug", message: "   " })).toEqual({
      message: "required",
    });
  });

  it("rejects a message longer than the column allows", () => {
    expect(
      validateFeedbackInput({
        kind: "bug",
        message: "x".repeat(FEEDBACK_MESSAGE_MAX_LENGTH + 1),
      }),
    ).toEqual({ message: "tooLong" });
  });

  it("accepts a message exactly at the limit", () => {
    expect(
      validateFeedbackInput({
        kind: "bug",
        message: "x".repeat(FEEDBACK_MESSAGE_MAX_LENGTH),
      }),
    ).toEqual({});
  });

  it("requires a kind", () => {
    expect(validateFeedbackInput({ kind: "", message: "שלום" })).toEqual({
      kind: "required",
    });
  });

  it("rejects a kind outside the schema's check constraint", () => {
    expect(validateFeedbackInput({ kind: "praise", message: "שלום" })).toEqual({
      kind: "invalid",
    });
  });

  it("reports every failing field at once", () => {
    const errors = validateFeedbackInput({ kind: "praise", message: "" });
    expect(errors).toEqual({ kind: "invalid", message: "required" });
    expect(hasFieldErrors(errors)).toBe(true);
  });
});
