import { describe, expect, it } from "vitest";

import { isValidSlug } from "./slug";

describe("isValidSlug", () => {
  it("accepts a simple lowercase slug", () => {
    expect(isValidSlug("wiggy-dev")).toBe(true);
  });

  it("accepts digits and multiple hyphen-separated segments", () => {
    expect(isValidSlug("salon-2-north")).toBe(true);
  });

  it("accepts a single-word slug with no hyphen", () => {
    expect(isValidSlug("wiggy")).toBe(true);
  });

  it("rejects uppercase letters", () => {
    expect(isValidSlug("Wiggy-Dev")).toBe(false);
  });

  it("rejects spaces", () => {
    expect(isValidSlug("wiggy dev")).toBe(false);
  });

  it("rejects leading or trailing hyphens", () => {
    expect(isValidSlug("-wiggy")).toBe(false);
    expect(isValidSlug("wiggy-")).toBe(false);
  });

  it("rejects doubled hyphens", () => {
    expect(isValidSlug("wiggy--dev")).toBe(false);
  });

  it("rejects an empty string", () => {
    expect(isValidSlug("")).toBe(false);
  });

  it("rejects non-ASCII characters (e.g. Hebrew)", () => {
    expect(isValidSlug("סלון")).toBe(false);
  });
});
