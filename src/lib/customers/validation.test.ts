import { describe, expect, it } from "vitest";

import { hasFieldErrors, validateCustomerInput } from "./validation";

function input(
  overrides: Partial<Parameters<typeof validateCustomerInput>[0]> = {},
) {
  return {
    name: "לקוחה",
    phone: "050-1234567",
    email: "test@example.com",
    notes: "",
    ...overrides,
  };
}

describe("validateCustomerInput", () => {
  it("passes for a fully valid input", () => {
    expect(validateCustomerInput(input())).toEqual({});
  });

  it("requires a non-blank name", () => {
    expect(validateCustomerInput(input({ name: "" }))).toEqual({
      name: "required",
    });
    expect(validateCustomerInput(input({ name: "   " }))).toEqual({
      name: "required",
    });
  });

  it("allows phone/email/notes to be blank (fields are intentionally simple)", () => {
    expect(
      validateCustomerInput(input({ phone: "", email: "", notes: "" })),
    ).toEqual({});
  });

  it("rejects a malformed email but allows an empty one", () => {
    expect(validateCustomerInput(input({ email: "not-an-email" }))).toEqual({
      email: "invalid",
    });
    expect(validateCustomerInput(input({ email: "" }))).toEqual({});
  });

  it("does not validate phone format (free text)", () => {
    expect(
      validateCustomerInput(input({ phone: "not a real phone number" })),
    ).toEqual({});
  });
});

describe("hasFieldErrors", () => {
  it("is false for an empty error map", () => {
    expect(hasFieldErrors({})).toBe(false);
  });

  it("is true when any field has an error", () => {
    expect(hasFieldErrors({ name: "required" })).toBe(true);
  });
});
