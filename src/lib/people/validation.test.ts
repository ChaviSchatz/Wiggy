import { describe, expect, it } from "vitest";

import { hasFieldErrors, validatePersonInput } from "./validation";

const base = {
  fullName: "דינה",
  title: "",
  defaultWorkStageId: "",
  isAssignable: true,
  isBookable: false,
  email: "",
  role: "",
};

describe("validatePersonInput", () => {
  it("accepts a roster-only person with just a name", () => {
    expect(hasFieldErrors(validatePersonInput(base))).toBe(false);
  });

  it("requires a name", () => {
    expect(validatePersonInput({ ...base, fullName: "  " }).fullName).toBe(
      "required",
    );
  });

  it("rejects a name over 120 characters", () => {
    expect(
      validatePersonInput({ ...base, fullName: "a".repeat(121) }).fullName,
    ).toBe("tooLong");
  });

  it("accepts a person being given a login", () => {
    const errors = validatePersonInput({
      ...base,
      email: "dina@example.com",
      role: "worker",
    });
    expect(hasFieldErrors(errors)).toBe(false);
  });

  // Access is all-or-nothing: a membership row cannot exist without a role,
  // and a role means nothing without someone to attach it to.
  it("requires a role when an email is given", () => {
    expect(
      validatePersonInput({ ...base, email: "dina@example.com" }).role,
    ).toBe("required");
  });

  it("requires an email when a role is given", () => {
    expect(validatePersonInput({ ...base, role: "worker" }).email).toBe(
      "required",
    );
  });

  it("rejects a malformed email", () => {
    expect(
      validatePersonInput({ ...base, email: "dina@", role: "worker" }).email,
    ).toBe("invalid");
  });

  it("rejects a role that is not a known role", () => {
    expect(
      validatePersonInput({ ...base, email: "d@e.com", role: "owner" }).role,
    ).toBe("invalid");
  });
});
