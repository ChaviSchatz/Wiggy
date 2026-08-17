import { describe, expect, it } from "vitest";

import { firstRank, rankAfter, rankBetween } from "./rank";

describe("firstRank", () => {
  it("returns a stable positive rank", () => {
    expect(firstRank()).toBeGreaterThan(0);
  });
});

describe("rankAfter", () => {
  it("gives an empty queue the first rank", () => {
    expect(rankAfter(null)).toBe(firstRank());
  });

  it("appends strictly after the last rank", () => {
    const last = rankAfter(null);
    const next = rankAfter(last);
    expect(next).toBeGreaterThan(last);
  });
});

describe("rankBetween", () => {
  it("returns the first rank for an empty queue (both ends null)", () => {
    expect(rankBetween(null, null)).toBe(firstRank());
  });

  it("drops below the first item when before is null", () => {
    const rank = rankBetween(null, 100);
    expect(rank).toBeLessThan(100);
    expect(rank).toBeGreaterThan(0);
  });

  it("drops after the last item when after is null", () => {
    const rank = rankBetween(100, null);
    expect(rank).toBeGreaterThan(100);
  });

  it("averages two neighbors when dropping in the middle", () => {
    expect(rankBetween(100, 200)).toBe(150);
  });

  it("keeps producing a distinct in-between rank across repeated inserts", () => {
    const before = 0;
    let after = 1024;
    for (let i = 0; i < 10; i++) {
      const mid = rankBetween(before, after);
      expect(mid).toBeGreaterThan(before);
      expect(mid).toBeLessThan(after);
      after = mid;
    }
  });
});
