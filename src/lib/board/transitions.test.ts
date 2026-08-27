import { describe, expect, it } from "vitest";

import { canUndoComplete, canUndoStart } from "./transitions";

describe("canUndoStart", () => {
  it("allows undoing a start that is still in progress", () => {
    expect(canUndoStart("in_progress")).toBe(true);
  });

  it("refuses when the task never started", () => {
    expect(canUndoStart("pending")).toBe(false);
  });

  it("refuses once the task has moved past in_progress", () => {
    expect(canUndoStart("done")).toBe(false);
    expect(canUndoStart("awaiting_approval")).toBe(false);
    expect(canUndoStart("deferred")).toBe(false);
  });
});

describe("canUndoComplete", () => {
  it("allows undoing a plain completion that needed no approval", () => {
    expect(canUndoComplete("done", false)).toBe(true);
  });

  it("allows pulling back a submission still awaiting approval", () => {
    expect(canUndoComplete("awaiting_approval", true)).toBe(true);
  });

  it("refuses to reopen a task an approver already approved", () => {
    // `done` + requires_approval means it went through approveTaskAction --
    // architecture §7.1 has no done -> in_progress edge, and the recorded
    // `task_approvals` row would be left describing a task that is no longer
    // done. Rework goes back through returnTaskForReworkAction instead.
    expect(canUndoComplete("done", true)).toBe(false);
  });

  it("refuses on a task that was never completed", () => {
    expect(canUndoComplete("in_progress", false)).toBe(false);
    expect(canUndoComplete("pending", false)).toBe(false);
  });
});
