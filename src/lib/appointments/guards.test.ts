import { describe, expect, it } from "vitest";

import { resolveViewableStaffMemberId } from "./guards";

describe("resolveViewableStaffMemberId", () => {
  const current = { staffMemberId: "me-1", isBookable: true };

  it("lets a manageAppointments holder view any requested staff member", () => {
    expect(
      resolveViewableStaffMemberId({
        canManageAppointments: true,
        current,
        requestedStaffMemberId: "someone-else",
      }),
    ).toBe("someone-else");
  });

  it("defaults a manageAppointments holder with no request to themselves if bookable", () => {
    expect(
      resolveViewableStaffMemberId({
        canManageAppointments: true,
        current,
        requestedStaffMemberId: null,
      }),
    ).toBe("me-1");
  });

  it("falls back to the first bookable staff member when the holder isn't bookable", () => {
    expect(
      resolveViewableStaffMemberId({
        canManageAppointments: true,
        current: { staffMemberId: null, isBookable: false },
        requestedStaffMemberId: null,
        firstBookableStaffMemberId: "first-1",
      }),
    ).toBe("first-1");
  });

  it("locks a non-manager to their own staff_member_id regardless of what was requested", () => {
    expect(
      resolveViewableStaffMemberId({
        canManageAppointments: false,
        current,
        requestedStaffMemberId: "someone-else",
      }),
    ).toBe("me-1");
  });

  it("returns null for a non-manager who isn't bookable at all", () => {
    expect(
      resolveViewableStaffMemberId({
        canManageAppointments: false,
        current: { staffMemberId: null, isBookable: false },
        requestedStaffMemberId: "anyone",
      }),
    ).toBeNull();
  });
});
