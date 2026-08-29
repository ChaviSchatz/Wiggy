import { describe, expect, it } from "vitest";

import { visibleSettingsSections } from "./sections";

function keys(role: Parameters<typeof visibleSettingsSections>[0]) {
  return visibleSettingsSections(role).map((section) => section.key);
}

describe("visibleSettingsSections", () => {
  it("gives an admin every section", () => {
    expect(keys("admin")).toEqual(["staff", "business"]);
  });

  it("gives a manager both, since cadence is a manager-level setting", () => {
    // The manager reaches /settings/business for sprint cadence even though
    // timezone inside it stays admin-only.
    expect(keys("manager")).toEqual(["staff", "business"]);
  });

  it("gives a secretary nothing, so the hub redirects", () => {
    expect(keys("secretary")).toEqual([]);
  });

  it("gives a worker nothing", () => {
    expect(keys("worker")).toEqual([]);
  });
});
