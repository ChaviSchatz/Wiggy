import { describe, expect, it } from "vitest";

import {
  hasAppointmentTypeErrors,
  validateAppointmentTypeInput,
} from "./validation";

describe("validateAppointmentTypeInput", () => {
  it("requires a name", () => {
    const errors = validateAppointmentTypeInput({
      name: "  ",
      defaultDurationMinutes: "",
    });
    expect(errors.name).toBe("required");
  });

  it("rejects a name over 120 characters", () => {
    const errors = validateAppointmentTypeInput({
      name: "a".repeat(121),
      defaultDurationMinutes: "",
    });
    expect(errors.name).toBe("tooLong");
  });

  it("allows an empty duration (no default)", () => {
    const errors = validateAppointmentTypeInput({
      name: "Fitting",
      defaultDurationMinutes: "",
    });
    expect(errors.defaultDurationMinutes).toBeUndefined();
  });

  it("rejects a non-positive duration", () => {
    expect(
      validateAppointmentTypeInput({
        name: "Fitting",
        defaultDurationMinutes: "0",
      }).defaultDurationMinutes,
    ).toBe("invalid");
    expect(
      validateAppointmentTypeInput({
        name: "Fitting",
        defaultDurationMinutes: "-5",
      }).defaultDurationMinutes,
    ).toBe("invalid");
  });

  it("rejects a non-numeric duration", () => {
    expect(
      validateAppointmentTypeInput({
        name: "Fitting",
        defaultDurationMinutes: "abc",
      }).defaultDurationMinutes,
    ).toBe("invalid");
  });

  it("accepts a valid input with no errors", () => {
    const errors = validateAppointmentTypeInput({
      name: "Fitting",
      defaultDurationMinutes: "30",
    });
    expect(hasAppointmentTypeErrors(errors)).toBe(false);
  });
});
