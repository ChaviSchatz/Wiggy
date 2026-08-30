import { describe, expect, it } from "vitest";

import { defaultConfigFor } from "./item-config";

describe("defaultConfigFor", () => {
  it("makes a new field visible in the intake form", () => {
    // The wizard filters on `config.visible !== false`, so a field created
    // with `visible: false` silently never appears -- which is what someone
    // adding a field least expects.
    expect(defaultConfigFor("field").visible).toBe(true);
    expect(defaultConfigFor("field").mandatory).toBe(false);
  });

  it("makes a new task type generate a task", () => {
    const config = defaultConfigFor("task_type");

    expect(config.generates_runtime_tasks).toBe(true);
    expect(config.default_selected).toBe(false);
    expect(config.mandatory).toBe(false);
  });

  it("gives a new task group the everyday multi-select shape", () => {
    const config = defaultConfigFor("task_group");

    expect(config.generates_runtime_tasks).toBe(true);
    expect(config.selection_mode).toBe("multi");
    expect(config.display_style).toBe("checklist");
  });

  it("leaves a new section with nothing switched on", () => {
    // A section's title arrives from the add form, not from defaults.
    expect(defaultConfigFor("section")).toEqual({ allow_other: false });
  });
});
