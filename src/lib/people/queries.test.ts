import { describe, expect, it } from "vitest";

import { toPersonListItem, type Person } from "./queries";

function person(overrides: Partial<Person> = {}): Person {
  return {
    id: "p1",
    business_id: "b1",
    full_name: "דינה",
    title: null,
    default_work_stage_id: null,
    user_id: null,
    is_active: true,
    is_assignable: true,
    is_bookable: false,
    created_at: "2026-09-10T00:00:00Z",
    updated_at: "2026-09-10T00:00:00Z",
    ...overrides,
  };
}

const empty = {
  stageNameById: new Map<string, string>(),
  profileById: new Map(),
  membershipByUserId: new Map(),
};

describe("toPersonListItem", () => {
  it("maps a roster-only person to no login and no role", () => {
    const item = toPersonListItem(person(), empty);

    expect(item.role).toBeNull();
    expect(item.linkedUserName).toBeNull();
    expect(item.linkedEmail).toBeNull();
    expect(item.membershipActive).toBe(false);
  });

  it("maps a linked person to their role and profile", () => {
    const item = toPersonListItem(person({ user_id: "u1" }), {
      ...empty,
      profileById: new Map([
        ["u1", { id: "u1", full_name: "דינה כהן", email: "dina@example.com" }],
      ]),
      membershipByUserId: new Map([
        ["u1", { user_id: "u1", role: "worker", is_active: true }],
      ]),
    });

    expect(item.role).toBe("worker");
    expect(item.linkedUserName).toBe("דינה כהן");
    expect(item.linkedEmail).toBe("dina@example.com");
    expect(item.membershipActive).toBe(true);
  });

  it("falls back to the email when the profile has no name", () => {
    const item = toPersonListItem(person({ user_id: "u1" }), {
      ...empty,
      profileById: new Map([
        ["u1", { id: "u1", full_name: null, email: "dina@example.com" }],
      ]),
    });

    expect(item.linkedUserName).toBe("dina@example.com");
  });

  // `memberships.role` is plain text in the schema, so a value outside the
  // known roles must not crash the whole list.
  it("treats an unrecognised stored role as no role", () => {
    const item = toPersonListItem(person({ user_id: "u1" }), {
      ...empty,
      membershipByUserId: new Map([
        ["u1", { user_id: "u1", role: "owner", is_active: true }],
      ]),
    });

    expect(item.role).toBeNull();
  });

  it("reports a revoked login as inactive", () => {
    const item = toPersonListItem(person({ user_id: "u1" }), {
      ...empty,
      membershipByUserId: new Map([
        ["u1", { user_id: "u1", role: "worker", is_active: false }],
      ]),
    });

    expect(item.membershipActive).toBe(false);
  });

  it("maps a dangling stage reference to null instead of throwing", () => {
    const item = toPersonListItem(
      person({ default_work_stage_id: "gone" }),
      empty,
    );

    expect(item.workStageName).toBeNull();
  });

  it("resolves a known stage name", () => {
    const item = toPersonListItem(person({ default_work_stage_id: "s1" }), {
      ...empty,
      stageNameById: new Map([["s1", "תפירה"]]),
    });

    expect(item.workStageName).toBe("תפירה");
  });
});
