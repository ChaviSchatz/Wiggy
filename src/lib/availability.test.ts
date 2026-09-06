import { describe, expect, it } from "vitest";

import {
  computeAvailability,
  findBlockingTask,
  isTaskAvailable,
  type TaskAvailabilityInput,
} from "./availability";

function task(
  overrides: Partial<TaskAvailabilityInput> & { id: string },
): TaskAvailabilityInput {
  return {
    workOrderId: "order-1",
    sequenceOrder: 0,
    status: "pending",
    availabilityOverride: false,
    ...overrides,
  };
}

describe("computeAvailability", () => {
  it("the first task in an order is always available", () => {
    const tasks = [task({ id: "t1", sequenceOrder: 0 })];

    expect(computeAvailability(tasks).get("t1")).toBe("available");
  });

  it("blocks a later task while an earlier one is still pending", () => {
    const tasks = [
      task({ id: "t1", sequenceOrder: 0, status: "pending" }),
      task({ id: "t2", sequenceOrder: 1, status: "pending" }),
    ];

    const availability = computeAvailability(tasks);
    expect(availability.get("t1")).toBe("available");
    expect(availability.get("t2")).toBe("blocked");
  });

  it("unblocks once every earlier task is done/skipped/cancelled", () => {
    const tasks = [
      task({ id: "t1", sequenceOrder: 0, status: "done" }),
      task({ id: "t2", sequenceOrder: 1, status: "skipped" }),
      task({ id: "t3", sequenceOrder: 2, status: "pending" }),
    ];

    expect(computeAvailability(tasks).get("t3")).toBe("available");
  });

  it("stays blocked if an earlier task is in_progress, awaiting_approval, returned_for_rework, or deferred", () => {
    const statuses: TaskAvailabilityInput["status"][] = [
      "in_progress",
      "awaiting_approval",
      "returned_for_rework",
      "deferred",
    ];

    for (const status of statuses) {
      const tasks = [
        task({ id: "t1", sequenceOrder: 0, status }),
        task({ id: "t2", sequenceOrder: 1, status: "pending" }),
      ];
      expect(computeAvailability(tasks).get("t2")).toBe("blocked");
    }
  });

  it("cancelled counts as resolved, same as done/skipped", () => {
    const tasks = [
      task({ id: "t1", sequenceOrder: 0, status: "cancelled" }),
      task({ id: "t2", sequenceOrder: 1, status: "pending" }),
    ];

    expect(computeAvailability(tasks).get("t2")).toBe("available");
  });

  it("a manager override makes a blocked task available regardless of earlier tasks", () => {
    const tasks = [
      task({ id: "t1", sequenceOrder: 0, status: "pending" }),
      task({
        id: "t2",
        sequenceOrder: 1,
        status: "pending",
        availabilityOverride: true,
      }),
    ];

    expect(computeAvailability(tasks).get("t2")).toBe("available");
    // The override is per-task -- it doesn't unblock its siblings.
    expect(computeAvailability(tasks).get("t1")).toBe("available");
  });

  it("evaluates each work order independently", () => {
    const tasks = [
      task({
        id: "a1",
        workOrderId: "order-a",
        sequenceOrder: 0,
        status: "pending",
      }),
      task({
        id: "a2",
        workOrderId: "order-a",
        sequenceOrder: 1,
        status: "pending",
      }),
      task({
        id: "b1",
        workOrderId: "order-b",
        sequenceOrder: 0,
        status: "done",
      }),
      task({
        id: "b2",
        workOrderId: "order-b",
        sequenceOrder: 1,
        status: "pending",
      }),
    ];

    const availability = computeAvailability(tasks);
    expect(availability.get("a2")).toBe("blocked");
    expect(availability.get("b2")).toBe("available");
  });

  it("does not depend on input array order, only sequence_order", () => {
    const tasks = [
      task({ id: "t2", sequenceOrder: 1, status: "pending" }),
      task({ id: "t1", sequenceOrder: 0, status: "pending" }),
    ];

    expect(computeAvailability(tasks).get("t2")).toBe("blocked");
  });
});

describe("findBlockingTask", () => {
  it("returns null when the task isn't blocked", () => {
    const t1 = task({ id: "t1", sequenceOrder: 0, status: "pending" });
    expect(findBlockingTask(t1, [t1])).toBeNull();
  });

  it("returns the earlier unresolved task", () => {
    const t1 = task({ id: "t1", sequenceOrder: 0, status: "in_progress" });
    const t2 = task({ id: "t2", sequenceOrder: 1, status: "pending" });
    expect(findBlockingTask(t2, [t1, t2])?.id).toBe("t1");
  });

  it("returns the earliest of several unresolved earlier tasks", () => {
    const t1 = task({ id: "t1", sequenceOrder: 0, status: "pending" });
    const t2 = task({ id: "t2", sequenceOrder: 1, status: "in_progress" });
    const t3 = task({ id: "t3", sequenceOrder: 2, status: "pending" });
    expect(findBlockingTask(t3, [t1, t2, t3])?.id).toBe("t1");
  });

  it("ignores done/skipped/cancelled earlier tasks", () => {
    const t1 = task({ id: "t1", sequenceOrder: 0, status: "done" });
    const t2 = task({ id: "t2", sequenceOrder: 1, status: "pending" });
    expect(findBlockingTask(t2, [t1, t2])).toBeNull();
  });

  it("only looks within the same work order", () => {
    const other = task({
      id: "a1",
      workOrderId: "order-a",
      sequenceOrder: 0,
      status: "pending",
    });
    const t2 = task({
      id: "b2",
      workOrderId: "order-b",
      sequenceOrder: 1,
      status: "pending",
    });
    expect(findBlockingTask(t2, [other, t2])).toBeNull();
  });
});

describe("isTaskAvailable", () => {
  it("matches computeAvailability for the given task", () => {
    const t1 = task({ id: "t1", sequenceOrder: 0, status: "pending" });
    const t2 = task({ id: "t2", sequenceOrder: 1, status: "pending" });

    expect(isTaskAvailable(t1, [t1, t2])).toBe(true);
    expect(isTaskAvailable(t2, [t1, t2])).toBe(false);
  });
});
