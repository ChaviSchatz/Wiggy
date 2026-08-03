import { describe, expect, it } from "vitest";

import type { Role } from "@/lib/roles";
import { sideNavItems, visibleSideNavItems } from "./nav-items";

function keysFor(role: Role) {
  return visibleSideNavItems(role).map((item) => item.key);
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
});
