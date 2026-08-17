import { describe, expect, it } from "vitest";

import { deriveOrderStatus } from "./status";

describe("deriveOrderStatus", () => {
  it("returns confirmed when there are no tasks", () => {
    expect(deriveOrderStatus([])).toBe("confirmed");
  });

  it("returns confirmed when every task is still pending", () => {
    expect(deriveOrderStatus(["pending", "pending"])).toBe("confirmed");
  });

  it("returns active once any task has moved beyond pending", () => {
    expect(deriveOrderStatus(["pending", "in_progress"])).toBe("active");
    expect(deriveOrderStatus(["pending", "awaiting_approval"])).toBe("active");
    expect(deriveOrderStatus(["pending", "deferred"])).toBe("active");
  });

  it("returns ready_for_handoff when every non-skipped/cancelled task is done", () => {
    expect(deriveOrderStatus(["done", "done"])).toBe("ready_for_handoff");
    expect(deriveOrderStatus(["done", "skipped", "cancelled"])).toBe(
      "ready_for_handoff",
    );
  });

  it("treats an order of entirely skipped/cancelled tasks as ready_for_handoff", () => {
    expect(deriveOrderStatus(["skipped", "cancelled"])).toBe(
      "ready_for_handoff",
    );
  });

  it("stays active when some tasks are done but others are still in progress", () => {
    expect(deriveOrderStatus(["done", "in_progress"])).toBe("active");
  });

  it("returns active, not ready_for_handoff, when a done task sits alongside a pending one", () => {
    expect(deriveOrderStatus(["done", "pending"])).toBe("active");
  });
});
