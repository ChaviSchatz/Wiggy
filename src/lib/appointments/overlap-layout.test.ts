import { describe, expect, it } from "vitest";
import { computeOverlapLayout } from "./overlap-layout";

describe("computeOverlapLayout", () => {
  it("gives every item its own single column when nothing overlaps", () => {
    const result = computeOverlapLayout([
      { id: "a", startsAt: "2026-09-14T08:00:00Z", endsAt: "2026-09-14T08:30:00Z" },
      { id: "b", startsAt: "2026-09-14T09:00:00Z", endsAt: "2026-09-14T09:30:00Z" },
    ]);
    expect(result.get("a")).toEqual({ column: 0, columnCount: 1 });
    expect(result.get("b")).toEqual({ column: 0, columnCount: 1 });
  });

  it("splits two overlapping items into two side-by-side columns", () => {
    const result = computeOverlapLayout([
      { id: "a", startsAt: "2026-09-14T10:00:00Z", endsAt: "2026-09-14T10:45:00Z" },
      { id: "b", startsAt: "2026-09-14T10:15:00Z", endsAt: "2026-09-14T11:00:00Z" },
    ]);
    expect(result.get("a")).toEqual({ column: 0, columnCount: 2 });
    expect(result.get("b")).toEqual({ column: 1, columnCount: 2 });
  });

  it("does not treat back-to-back (touching) items as overlapping", () => {
    const result = computeOverlapLayout([
      { id: "a", startsAt: "2026-09-14T10:00:00Z", endsAt: "2026-09-14T10:30:00Z" },
      { id: "b", startsAt: "2026-09-14T10:30:00Z", endsAt: "2026-09-14T11:00:00Z" },
    ]);
    expect(result.get("a")).toEqual({ column: 0, columnCount: 1 });
    expect(result.get("b")).toEqual({ column: 0, columnCount: 1 });
  });

  it("starts a fresh cluster/column when a third item begins exactly as the prior cluster ends", () => {
    const result = computeOverlapLayout([
      { id: "a", startsAt: "2026-09-14T10:00:00Z", endsAt: "2026-09-14T10:30:00Z" },
      { id: "b", startsAt: "2026-09-14T10:00:00Z", endsAt: "2026-09-14T10:30:00Z" },
      { id: "c", startsAt: "2026-09-14T10:30:00Z", endsAt: "2026-09-14T11:00:00Z" },
    ]);
    expect(result.get("a")?.columnCount).toBe(2);
    expect(result.get("b")?.columnCount).toBe(2);
    expect(result.get("c")).toEqual({ column: 0, columnCount: 1 });
  });

  it("splits three mutually-overlapping items into three columns", () => {
    const result = computeOverlapLayout([
      { id: "a", startsAt: "2026-09-14T10:00:00Z", endsAt: "2026-09-14T11:00:00Z" },
      { id: "b", startsAt: "2026-09-14T10:10:00Z", endsAt: "2026-09-14T10:50:00Z" },
      { id: "c", startsAt: "2026-09-14T10:20:00Z", endsAt: "2026-09-14T10:40:00Z" },
    ]);
    const cols = new Set([result.get("a")?.column, result.get("b")?.column, result.get("c")?.column]);
    expect(cols.size).toBe(3);
    expect(result.get("a")?.columnCount).toBe(3);
  });

  it("keeps an unrelated later-day cluster from widening an earlier one", () => {
    const result = computeOverlapLayout([
      { id: "a", startsAt: "2026-09-14T08:00:00Z", endsAt: "2026-09-14T08:30:00Z" },
      { id: "x", startsAt: "2026-09-14T14:00:00Z", endsAt: "2026-09-14T14:45:00Z" },
      { id: "y", startsAt: "2026-09-14T14:15:00Z", endsAt: "2026-09-14T15:00:00Z" },
    ]);
    expect(result.get("a")).toEqual({ column: 0, columnCount: 1 });
    expect(result.get("x")?.columnCount).toBe(2);
  });
});
