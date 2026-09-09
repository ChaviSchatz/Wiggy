import { describe, expect, it, vi } from "vitest";

import {
  InviteError,
  findUserIdByEmail,
  normalizeEmail,
  type InviteAdminClient,
} from "./index";

function listUsersStub(pages: { id: string; email: string }[][]) {
  let call = 0;
  return {
    auth: {
      admin: {
        listUsers: vi.fn(async () => ({
          data: { users: pages[call++] ?? [] },
          error: null,
        })),
      },
    },
  } as unknown as InviteAdminClient;
}

describe("normalizeEmail", () => {
  it("lowercases and trims so a retyped address still matches the existing user", () => {
    expect(normalizeEmail("  Dina@Example.COM ")).toBe("dina@example.com");
  });
});

describe("findUserIdByEmail", () => {
  it("finds a user on the first page", async () => {
    const admin = listUsersStub([[{ id: "u1", email: "dina@example.com" }]]);
    await expect(findUserIdByEmail(admin, "dina@example.com")).resolves.toBe(
      "u1",
    );
  });

  it("returns undefined when the pages run out", async () => {
    const admin = listUsersStub([[]]);
    await expect(
      findUserIdByEmail(admin, "nobody@example.com"),
    ).resolves.toBeUndefined();
  });

  // A short page means the last page, so the scan must not request another.
  it("stops scanning after a partial page", async () => {
    const admin = listUsersStub([[{ id: "u1", email: "other@example.com" }]]);
    await expect(
      findUserIdByEmail(admin, "dina@example.com"),
    ).resolves.toBeUndefined();
    expect(admin.auth.admin.listUsers).toHaveBeenCalledTimes(1);
  });

  it("raises InviteError when the admin API fails", async () => {
    const admin = {
      auth: {
        admin: {
          listUsers: vi.fn(async () => ({
            data: { users: [] },
            error: new Error("boom"),
          })),
        },
      },
    } as unknown as InviteAdminClient;

    await expect(findUserIdByEmail(admin, "dina@example.com")).rejects.toThrow(
      InviteError,
    );
  });
});
