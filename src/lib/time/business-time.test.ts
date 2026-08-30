import { describe, expect, it } from "vitest";

import {
  addCalendarDays,
  businessDateString,
  businessDayStart,
} from "./business-time";

const JERUSALEM = "Asia/Jerusalem";

describe("businessDateString", () => {
  it("returns the date as the business sees it, not UTC", () => {
    // 22:30 UTC in summer is already 01:30 the next day in Israel (UTC+3).
    // This is the original bug: a UTC slice reports the previous day.
    const at = new Date("2026-08-27T22:30:00Z");

    expect(businessDateString(at, JERUSALEM)).toBe("2026-08-28");
    expect(businessDateString(at, "UTC")).toBe("2026-08-27");
  });

  it("handles winter time, when Israel is UTC+2", () => {
    const at = new Date("2026-01-15T22:30:00Z");

    expect(businessDateString(at, JERUSALEM)).toBe("2026-01-16");
  });

  it("is not hardcoded to Israel", () => {
    const at = new Date("2026-08-27T22:30:00Z");

    expect(businessDateString(at, "America/New_York")).toBe("2026-08-27");
    expect(businessDateString(at, "Pacific/Auckland")).toBe("2026-08-28");
  });
});

describe("businessDayStart", () => {
  it("returns the UTC instant of local midnight in summer (UTC+3)", () => {
    const at = new Date("2026-08-27T22:30:00Z"); // local 2026-08-28 01:30

    expect(businessDayStart(at, JERUSALEM).toISOString()).toBe(
      "2026-08-27T21:00:00.000Z",
    );
  });

  it("returns the UTC instant of local midnight in winter (UTC+2)", () => {
    const at = new Date("2026-01-16T09:00:00Z");

    expect(businessDayStart(at, JERUSALEM).toISOString()).toBe(
      "2026-01-15T22:00:00.000Z",
    );
  });

  it("matches the instant itself for UTC", () => {
    const at = new Date("2026-08-27T22:30:00Z");

    expect(businessDayStart(at, "UTC").toISOString()).toBe(
      "2026-08-27T00:00:00.000Z",
    );
  });
});

describe("addCalendarDays", () => {
  it("adds days within a month", () => {
    expect(addCalendarDays("2026-08-23", 7)).toBe("2026-08-30");
  });

  it("rolls over month and year boundaries", () => {
    expect(addCalendarDays("2026-08-30", 7)).toBe("2026-09-06");
    expect(addCalendarDays("2026-12-28", 7)).toBe("2027-01-04");
  });

  it("handles a leap day", () => {
    expect(addCalendarDays("2028-02-28", 1)).toBe("2028-02-29");
  });
});
