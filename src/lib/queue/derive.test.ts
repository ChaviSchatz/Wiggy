import { describe, expect, it } from "vitest";

import type { Availability } from "@/lib/availability";
import { deriveQueueSections, type QueueTaskInput } from "./derive";

function task(overrides: Partial<QueueTaskInput> & { id: string }): QueueTaskInput {
  return {
    status: "pending",
    queueRank: null,
    ...overrides,
  };
}

describe("deriveQueueSections", () => {
  it("puts an in-progress task in current", () => {
    const tasks = [task({ id: "t1", status: "in_progress" })];
    const result = deriveQueueSections(tasks, new Map());
    expect(result.current).toEqual([tasks[0]]);
  });

  it("picks the lowest-ranked available task as next, the rest as queue", () => {
    const tasks = [
      task({ id: "t1", status: "pending", queueRank: 30 }),
      task({ id: "t2", status: "pending", queueRank: 10 }),
      task({ id: "t3", status: "pending", queueRank: 20 }),
    ];
    const availability = new Map<string, Availability>([
      ["t1", "available"],
      ["t2", "available"],
      ["t3", "available"],
    ]);

    const result = deriveQueueSections(tasks, availability);
    expect(result.next?.id).toBe("t2");
    expect(result.queue.map((t) => t.id)).toEqual(["t3", "t1"]);
  });

  it("treats returned_for_rework as startable, same as pending", () => {
    const tasks = [
      task({ id: "t1", status: "returned_for_rework", queueRank: 10 }),
    ];
    const availability = new Map<string, Availability>([["t1", "available"]]);

    const result = deriveQueueSections(tasks, availability);
    expect(result.next?.id).toBe("t1");
  });

  it("buckets a sequence-blocked task as blocked with reason 'sequence'", () => {
    const tasks = [task({ id: "t1", status: "pending", queueRank: 10 })];
    const availability = new Map<string, Availability>([["t1", "blocked"]]);

    const result = deriveQueueSections(tasks, availability);
    expect(result.next).toBeNull();
    expect(result.blocked).toEqual([{ task: tasks[0], reason: "sequence" }]);
  });

  it("buckets a deferred task as blocked with reason 'deferred', regardless of availability", () => {
    const tasks = [task({ id: "t1", status: "deferred", queueRank: 10 })];

    const result = deriveQueueSections(tasks, new Map());
    expect(result.blocked).toEqual([{ task: tasks[0], reason: "deferred" }]);
  });

  it("buckets done/skipped/cancelled tasks as completed", () => {
    const tasks = [
      task({ id: "t1", status: "done" }),
      task({ id: "t2", status: "skipped" }),
      task({ id: "t3", status: "cancelled" }),
    ];

    const result = deriveQueueSections(tasks, new Map());
    expect(result.completed.map((t) => t.id)).toEqual(["t1", "t2", "t3"]);
  });

  it("excludes awaiting_approval tasks entirely (ADR 0009: separate approver view)", () => {
    const tasks = [task({ id: "t1", status: "awaiting_approval" })];

    const result = deriveQueueSections(tasks, new Map());
    expect(result.current).toEqual([]);
    expect(result.next).toBeNull();
    expect(result.queue).toEqual([]);
    expect(result.blocked).toEqual([]);
    expect(result.completed).toEqual([]);
  });

  it("returns null for next when there is no startable task", () => {
    const result = deriveQueueSections([], new Map());
    expect(result.next).toBeNull();
  });
});
