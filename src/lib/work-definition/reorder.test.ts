import { describe, expect, it } from "vitest";

import { renumberItems } from "./reorder";

const list = ["a", "b", "c", "d"];

describe("renumberItems", () => {
  it("moves an item one place towards the start", () => {
    expect(renumberItems(list, 2, "up")).toEqual(["a", "c", "b", "d"]);
  });

  it("moves an item one place towards the end", () => {
    expect(renumberItems(list, 1, "down")).toEqual(["a", "c", "b", "d"]);
  });

  it("is a no-op at the first position moving up", () => {
    expect(renumberItems(list, 0, "up")).toEqual(list);
  });

  it("is a no-op at the last position moving down", () => {
    expect(renumberItems(list, 3, "down")).toEqual(list);
  });

  it("is a no-op for an index outside the list", () => {
    expect(renumberItems(list, -1, "up")).toEqual(list);
    expect(renumberItems(list, 9, "down")).toEqual(list);
  });

  it("does not mutate the input", () => {
    const original = [...list];
    renumberItems(list, 2, "up");
    expect(list).toEqual(original);
  });

  it("handles a single-item list", () => {
    expect(renumberItems(["only"], 0, "up")).toEqual(["only"]);
    expect(renumberItems(["only"], 0, "down")).toEqual(["only"]);
  });
});
