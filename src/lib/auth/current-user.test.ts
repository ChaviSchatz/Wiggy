import { describe, expect, it } from "vitest";

import { landingPathForRole, needsBootstrap } from "./current-user";

describe("needsBootstrap", () => {
  it("is true when the display name is missing or blank", () => {
    expect(needsBootstrap({ fullName: null })).toBe(true);
    expect(needsBootstrap({ fullName: "" })).toBe(true);
    expect(needsBootstrap({ fullName: "   " })).toBe(true);
  });

  it("is false once a display name is set", () => {
    expect(needsBootstrap({ fullName: "Wiggy Admin" })).toBe(false);
  });
});

describe("landingPathForRole", () => {
  it("sends workers to their personal queue", () => {
    expect(landingPathForRole("worker")).toBe("/my-work");
  });

  it("sends secretaries to the work-order list", () => {
    expect(landingPathForRole("secretary")).toBe("/orders");
  });

  it("sends managers and admins to the dashboard", () => {
    expect(landingPathForRole("manager")).toBe("/");
    expect(landingPathForRole("admin")).toBe("/");
  });
});
