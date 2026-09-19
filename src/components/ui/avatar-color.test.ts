import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { MONOGRAM_COLORS, colorForName } from "./avatar-color";

describe("colorForName", () => {
  it("is stable for the same name", () => {
    expect(colorForName("דינה כהן")).toBe(colorForName("דינה כהן"));
  });

  it("always returns one of the monogram colours", () => {
    for (const name of ["", "a", "דינה", "Shira Golan", "😀"]) {
      expect(MONOGRAM_COLORS).toContain(colorForName(name));
    }
  });
});

/**
 * Server components (e.g. the calendar page's legend) call `colorForName`
 * directly. Next.js turns every export of a `"use client"` module into a
 * client reference when imported from a server component, so calling it there
 * throws "colorForName is not a function". This module must stay directive-free.
 */
describe("avatar-color module", () => {
  it("is not a client module", () => {
    const source = readFileSync(
      join(process.cwd(), "src/components/ui/avatar-color.ts"),
      "utf8",
    );
    expect(source).not.toMatch(/^\s*["']use client["']/m);
  });
});
