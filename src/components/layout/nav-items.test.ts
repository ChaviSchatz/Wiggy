import { describe, expect, it } from "vitest";

import type { Role } from "@/lib/roles";
import {
  bottomNavItems,
  sideNavItems,
  visibleBottomNavItems,
  visibleSideNavItems,
} from "./nav-items";

function keysFor(role: Role, isBookable = false) {
  return visibleSideNavItems({ role, isBookable }).map((item) => item.key);
}

function bottomKeysFor(role: Role, isBookable = false) {
  return visibleBottomNavItems({ role, isBookable }).map((item) => item.key);
}

describe("visibleSideNavItems", () => {
  it("shows an admin every side-nav item", () => {
    expect(keysFor("admin")).toEqual(sideNavItems.map((item) => item.key));
  });

  it("shows a worker only the dashboard, their queue, and the board", () => {
    expect(keysFor("worker")).toEqual(["dashboard", "myWork", "board"]);
  });

  it("shows a secretary orders/customers/missing-items but not sprint/settings", () => {
    expect(keysFor("secretary")).toEqual([
      "dashboard",
      "board",
      "calendar",
      "orders",
      "customers",
      "missingItems",
    ]);
  });

  it("shows a manager everything except users/roles-only admin settings", () => {
    // roles.ts grants managers `manageStaff`, so Settings is visible to them
    // too (docs/ui/information-architecture.md: "Settings/Admin ... ✓ (ops)").
    expect(keysFor("manager")).toEqual(sideNavItems.map((item) => item.key));
  });

  it("shows Calendar to a manageAppointments holder", () => {
    const keys = visibleSideNavItems({
      role: "secretary",
      isBookable: false,
    }).map((i) => i.key);
    expect(keys).toContain("calendar");
  });

  it("shows Calendar to a bookable worker even without manageAppointments", () => {
    const keys = visibleSideNavItems({
      role: "worker",
      isBookable: true,
    }).map((i) => i.key);
    expect(keys).toContain("calendar");
  });

  it("hides Calendar from a non-bookable worker", () => {
    const keys = visibleSideNavItems({
      role: "worker",
      isBookable: false,
    }).map((i) => i.key);
    expect(keys).not.toContain("calendar");
  });
});

describe("visibleBottomNavItems", () => {
  it("gives a worker My Work, Board, Feedback, Profile (no Sprint/Approvals)", () => {
    expect(bottomKeysFor("worker")).toEqual([
      "myWork",
      "board",
      "feedback",
      "profile",
    ]);
  });

  it("gives a secretary Board, Calendar, Feedback, Profile (no personal queue or planning access)", () => {
    expect(bottomKeysFor("secretary")).toEqual([
      "board",
      "calendar",
      "feedback",
      "profile",
    ]);
  });

  it("gives managers/admins Sprint, Approvals, and Calendar, dropping the Feedback placeholder to avoid overcrowding", () => {
    for (const role of ["manager", "admin"] as const) {
      expect(bottomKeysFor(role)).toEqual([
        "myWork",
        "board",
        "sprint",
        "approvals",
        "calendar",
        "profile",
      ]);
    }
  });

  it("never grows past the full item list", () => {
    for (const role of ["admin", "manager", "secretary", "worker"] as const) {
      expect(bottomKeysFor(role).length).toBeLessThanOrEqual(
        bottomNavItems.length,
      );
    }
  });

  it("shows Calendar to a bookable worker in the bottom nav even without manageAppointments", () => {
    expect(bottomKeysFor("worker", true)).toContain("calendar");
  });

  it("hides Calendar from a non-bookable worker in the bottom nav", () => {
    expect(bottomKeysFor("worker", false)).not.toContain("calendar");
  });
});
