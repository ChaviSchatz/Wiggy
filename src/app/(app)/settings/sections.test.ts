import { describe, expect, it } from "vitest";

import { visibleSettingsSections } from "./sections";

function keys(role: Parameters<typeof visibleSettingsSections>[0]) {
  return visibleSettingsSections(role).map((section) => section.key);
}

describe("visibleSettingsSections", () => {
  it("gives an admin every section", () => {
    expect(keys("admin")).toEqual([
      "people",
      "business",
      "templates",
      "appointmentTypes",
    ]);
  });

  it("gives a manager both, since cadence is a manager-level setting", () => {
    // The manager reaches /settings/business for sprint cadence even though
    // timezone inside it stays admin-only.
    expect(keys("manager")).toEqual([
      "people",
      "business",
      "templates",
      "appointmentTypes",
    ]);
  });

  it("gives a secretary nothing, so the hub redirects", () => {
    expect(keys("secretary")).toEqual([]);
  });

  it("gives a worker nothing", () => {
    expect(keys("worker")).toEqual([]);
  });

  it("includes appointment types for roles with editWorkDefinition", () => {
    const adminKeys = visibleSettingsSections("admin").map((s) => s.key);
    const workerKeys = visibleSettingsSections("worker").map((s) => s.key);
    expect(adminKeys).toContain("appointmentTypes");
    expect(workerKeys).not.toContain("appointmentTypes");
  });
});
