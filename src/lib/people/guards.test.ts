import { describe, expect, it } from "vitest";

import { derivePersonAccessState, wouldRemoveLastAdmin } from "./guards";

describe("wouldRemoveLastAdmin", () => {
  it("blocks demoting the only active admin", () => {
    expect(wouldRemoveLastAdmin([{ userId: "a1" }], "a1")).toBe(true);
  });

  it("allows demoting an admin when another one remains", () => {
    expect(
      wouldRemoveLastAdmin([{ userId: "a1" }, { userId: "a2" }], "a1"),
    ).toBe(false);
  });

  it("allows changing someone who is not the last admin", () => {
    expect(wouldRemoveLastAdmin([{ userId: "a1" }], "w9")).toBe(false);
  });

  // Nothing to protect: the caller is not removing an admin at all.
  it("allows the change when the business has no active admins", () => {
    expect(wouldRemoveLastAdmin([], "a1")).toBe(false);
  });
});

describe("derivePersonAccessState", () => {
  it("is roster-only without a linked user", () => {
    expect(derivePersonAccessState(null, null)).toBe("rosterOnly");
  });

  it("is invited once linked but never signed in", () => {
    expect(derivePersonAccessState("u1", null)).toBe("invited");
  });

  it("is active once they have signed in", () => {
    expect(derivePersonAccessState("u1", "2026-09-10T00:00:00Z")).toBe(
      "active",
    );
  });

  // A failed service-role lookup degrades to null, which must read as
  // "invited" -- never as "no login", which would hide the resend action.
  it("treats an unknown sign-in time as invited, not roster-only", () => {
    expect(derivePersonAccessState("u1", null)).not.toBe("rosterOnly");
  });
});
