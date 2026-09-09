import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { isPlatformAdmin } from "./is-platform-admin";

describe("isPlatformAdmin", () => {
  const ORIGINAL_ENV = process.env.PLATFORM_ADMIN_EMAILS;

  beforeEach(() => {
    process.env.PLATFORM_ADMIN_EMAILS = "chava@wiggy.app, Team@Wiggy.app";
  });

  afterEach(() => {
    if (ORIGINAL_ENV === undefined) {
      delete process.env.PLATFORM_ADMIN_EMAILS;
    } else {
      process.env.PLATFORM_ADMIN_EMAILS = ORIGINAL_ENV;
    }
  });

  it("matches an email in the allowlist", () => {
    expect(isPlatformAdmin("chava@wiggy.app")).toBe(true);
  });

  it("matches case-insensitively, on both sides", () => {
    expect(isPlatformAdmin("CHAVA@WIGGY.APP")).toBe(true);
    expect(isPlatformAdmin("team@wiggy.app")).toBe(true);
  });

  it("rejects an email not in the allowlist", () => {
    expect(isPlatformAdmin("someone-else@example.com")).toBe(false);
  });

  it("rejects null, undefined, and empty string", () => {
    expect(isPlatformAdmin(null)).toBe(false);
    expect(isPlatformAdmin(undefined)).toBe(false);
    expect(isPlatformAdmin("")).toBe(false);
  });

  it("treats an unset env var as an empty allowlist", () => {
    delete process.env.PLATFORM_ADMIN_EMAILS;
    expect(isPlatformAdmin("chava@wiggy.app")).toBe(false);
  });
});
