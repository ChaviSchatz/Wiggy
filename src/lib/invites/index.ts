import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

/**
 * The Supabase Auth mechanics behind every invite in the app, shared by the
 * platform-admin console (creating a tenant's first admin) and the People
 * screen (a salon admin inviting their own staff).
 *
 * Deliberately knows nothing about `business_id`. The two callers have very
 * different trust boundaries -- platform-admin is gated by the cross-tenant
 * `PLATFORM_ADMIN_EMAILS` allowlist and takes the business from its form,
 * while People derives it from the calling admin's own session -- so scoping
 * every write stays the caller's job. Putting a business id in here is what
 * would let one tenant reach another.
 */

export type InviteAdminClient = SupabaseClient<Database>;

export type InviteErrorCode = "generic" | "inviteFailed";

export class InviteError extends Error {
  constructor(public readonly code: InviteErrorCode) {
    super(code);
    this.name = "InviteError";
  }
}

/** The admin list API's maximum page size. */
const PAGE_SIZE = 200;

/**
 * Lowercased and trimmed, so a differently-cased resubmission (autocorrect on
 * a phone, a retyped address) matches the existing auth user instead of
 * hitting "already registered" from a fresh invite.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * The admin list API is paginated with no filter-by-email, so scan until the
 * address is found or the pages run out (the same approach as
 * `scripts/seed-dev.ts`).
 */
export async function findUserIdByEmail(
  admin: InviteAdminClient,
  email: string,
): Promise<string | undefined> {
  const target = normalizeEmail(email);

  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: PAGE_SIZE,
    });
    if (error) throw new InviteError("generic");

    const match = data.users.find(
      (user) => user.email && normalizeEmail(user.email) === target,
    );
    if (match) return match.id;
    // A short page is the last page.
    if (data.users.length < PAGE_SIZE) return undefined;
  }
}

export type FindOrInviteResult = {
  userId: string;
  /** False when the address already had an account, so no email was sent. */
  invited: boolean;
};

/**
 * Finds the user for `email`, or invites them.
 *
 * The auth user exists the moment `inviteUserByEmail` returns -- long before
 * the invitee clicks anything -- and the `handle_new_user` trigger creates
 * their `profiles` row with it. That is what lets a caller link
 * `staff_members.user_id` immediately and assign work to someone who has not
 * accepted yet (ADR 0013).
 *
 * Also backfills `profiles.full_name`, which the trigger leaves empty --
 * `scripts/seed-dev.ts` fills the same gap by hand.
 */
export async function findOrInviteUser(
  admin: InviteAdminClient,
  input: { email: string; fullName: string },
  redirectTo: string,
): Promise<FindOrInviteResult> {
  const email = normalizeEmail(input.email);

  let userId = await findUserIdByEmail(admin, email);
  let invited = false;

  if (!userId) {
    const result = await admin.auth.admin.inviteUserByEmail(email, {
      data: { full_name: input.fullName },
      redirectTo,
    });
    if (result.error || !result.data.user) {
      throw new InviteError("inviteFailed");
    }
    userId = result.data.user.id;
    invited = true;
  }

  const updated = await admin
    .from("profiles")
    .update({ full_name: input.fullName })
    .eq("id", userId);
  if (updated.error) throw new InviteError("generic");

  return { userId, invited };
}

/** Re-sends the invite email to an address that already has an auth user. */
export async function resendInvite(
  admin: InviteAdminClient,
  email: string,
  redirectTo: string,
): Promise<void> {
  const { error } = await admin.auth.admin.inviteUserByEmail(
    normalizeEmail(email),
    { redirectTo },
  );
  if (error) throw new InviteError("inviteFailed");
}
