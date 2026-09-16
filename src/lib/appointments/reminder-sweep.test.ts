import { describe, expect, it } from "vitest";

import { isDueForReminder } from "./reminder-sweep";

describe("isDueForReminder", () => {
  const now = new Date("2026-09-14T10:00:00Z");

  it("is due when starts_at falls within the lead-hours window and no reminder was sent yet", () => {
    expect(
      isDueForReminder(
        { startsAt: "2026-09-14T20:00:00Z", reminderSentAt: null, status: "scheduled" },
        24,
        now,
      ),
    ).toBe(true);
  });

  it("is not due when starts_at is further out than the lead window", () => {
    expect(
      isDueForReminder(
        { startsAt: "2026-09-16T20:00:00Z", reminderSentAt: null, status: "scheduled" },
        24,
        now,
      ),
    ).toBe(false);
  });

  it("is not due once a reminder has already been sent", () => {
    expect(
      isDueForReminder(
        {
          startsAt: "2026-09-14T20:00:00Z",
          reminderSentAt: "2026-09-14T09:00:00Z",
          status: "scheduled",
        },
        24,
        now,
      ),
    ).toBe(false);
  });

  it("is not due for a non-scheduled appointment", () => {
    expect(
      isDueForReminder(
        { startsAt: "2026-09-14T20:00:00Z", reminderSentAt: null, status: "cancelled" },
        24,
        now,
      ),
    ).toBe(false);
  });

  it("is not due once the appointment has already started", () => {
    expect(
      isDueForReminder(
        { startsAt: "2026-09-14T09:00:00Z", reminderSentAt: null, status: "scheduled" },
        24,
        now,
      ),
    ).toBe(false);
  });
});
