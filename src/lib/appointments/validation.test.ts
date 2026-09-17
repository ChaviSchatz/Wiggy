import { describe, expect, it } from "vitest";

import type { AppointmentStatus } from "./types";
import {
  appointmentsOverlap,
  canTransitionStatus,
  validateAppointmentTimes,
} from "./validation";

describe("validateAppointmentTimes", () => {
  it("rejects an end time at or before the start time", () => {
    expect(
      validateAppointmentTimes("2026-09-14T10:00:00Z", "2026-09-14T10:00:00Z"),
    ).toBe("invalid");
    expect(
      validateAppointmentTimes("2026-09-14T10:00:00Z", "2026-09-14T09:00:00Z"),
    ).toBe("invalid");
  });

  it("accepts an end time after the start time", () => {
    expect(
      validateAppointmentTimes("2026-09-14T10:00:00Z", "2026-09-14T10:30:00Z"),
    ).toBeUndefined();
  });
});

describe("appointmentsOverlap", () => {
  const slot = {
    startsAt: "2026-09-14T10:00:00Z",
    endsAt: "2026-09-14T11:00:00Z",
  };

  it("detects a partial overlap on either side", () => {
    expect(
      appointmentsOverlap(slot, {
        startsAt: "2026-09-14T10:30:00Z",
        endsAt: "2026-09-14T11:30:00Z",
      }),
    ).toBe(true);
    expect(
      appointmentsOverlap(slot, {
        startsAt: "2026-09-14T09:30:00Z",
        endsAt: "2026-09-14T10:30:00Z",
      }),
    ).toBe(true);
  });

  it("detects one slot fully containing the other", () => {
    expect(
      appointmentsOverlap(slot, {
        startsAt: "2026-09-14T09:00:00Z",
        endsAt: "2026-09-14T12:00:00Z",
      }),
    ).toBe(true);
  });

  it("does not flag back-to-back slots as overlapping", () => {
    expect(
      appointmentsOverlap(slot, {
        startsAt: "2026-09-14T11:00:00Z",
        endsAt: "2026-09-14T12:00:00Z",
      }),
    ).toBe(false);
  });

  it("does not flag disjoint slots", () => {
    expect(
      appointmentsOverlap(slot, {
        startsAt: "2026-09-14T13:00:00Z",
        endsAt: "2026-09-14T14:00:00Z",
      }),
    ).toBe(false);
  });
});

describe("canTransitionStatus", () => {
  it("allows scheduled to move to any terminal status", () => {
    expect(canTransitionStatus("scheduled", "completed")).toBe(true);
    expect(canTransitionStatus("scheduled", "cancelled")).toBe(true);
    expect(canTransitionStatus("scheduled", "no_show")).toBe(true);
  });

  it("allows scheduled to stay scheduled (a reschedule/edit)", () => {
    expect(canTransitionStatus("scheduled", "scheduled")).toBe(true);
  });

  it("rejects any transition out of a terminal status", () => {
    expect(canTransitionStatus("completed", "scheduled")).toBe(false);
    expect(canTransitionStatus("cancelled", "scheduled")).toBe(false);
    expect(canTransitionStatus("no_show", "completed")).toBe(false);
  });

  it("rejects an unrecognized target status even from scheduled", () => {
    expect(
      canTransitionStatus("scheduled", "bogus" as AppointmentStatus),
    ).toBe(false);
  });
});
