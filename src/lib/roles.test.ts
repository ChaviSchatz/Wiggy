import { describe, expect, it } from "vitest";

import { can, isRole, PERMISSIONS, ROLES } from "./roles";

describe("roles/can", () => {
  it("grants admins every permission", () => {
    for (const permission of PERMISSIONS) {
      expect(can("admin", permission)).toBe(true);
    }
  });

  it("lets managers plan sprints and approve tasks but not manage users", () => {
    expect(can("manager", "planSprint")).toBe(true);
    expect(can("manager", "approveTasks")).toBe(true);
    expect(can("manager", "manageStaff")).toBe(true);
    expect(can("manager", "manageUsers")).toBe(false);
    expect(can("manager", "editBranding")).toBe(false);
  });

  it("limits the secretary to order/customer intake and the board", () => {
    expect(can("secretary", "createOrders")).toBe(true);
    expect(can("secretary", "editCustomers")).toBe(true);
    expect(can("secretary", "manageMissingItems")).toBe(true);
    expect(can("secretary", "viewBoard")).toBe(true);
    expect(can("secretary", "approveTasks")).toBe(false);
    expect(can("secretary", "planSprint")).toBe(false);
  });

  it("limits workers to viewing the board and working their own tasks", () => {
    expect(can("worker", "viewBoard")).toBe(true);
    expect(can("worker", "workOwnTasks")).toBe(true);
    expect(can("worker", "createOrders")).toBe(false);
    expect(can("worker", "manageStaff")).toBe(false);
  });

  it("exposes the four canonical roles", () => {
    expect([...ROLES]).toEqual(["admin", "manager", "secretary", "worker"]);
  });
});

describe("isRole", () => {
  it("accepts every canonical role", () => {
    for (const role of ROLES) {
      expect(isRole(role)).toBe(true);
    }
  });

  it("rejects arbitrary text, which is what `memberships.role` stores", () => {
    expect(isRole("owner")).toBe(false);
    expect(isRole("")).toBe(false);
  });
});
