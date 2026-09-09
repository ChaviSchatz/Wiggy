/**
 * The People screen's safety rails, as pure predicates.
 *
 * They live outside the Server Actions so the rules that keep a salon from
 * locking itself out are testable without a database -- the actions call
 * these, the UI only mirrors them.
 */

export type PersonAccessState = "rosterOnly" | "invited" | "active";

/**
 * The three states a person can be in, derived and never stored.
 *
 * `lastSignInAt` comes from Supabase Auth via the service-role client. A
 * linked user who has never signed in is still fully assignable (ADR 0013),
 * so this only ever drives a badge and which access actions are offered.
 *
 * A failed lookup passes `null`, which reads as "invited" -- the safe
 * degradation, since it keeps the resend action reachable.
 */
export function derivePersonAccessState(
  userId: string | null,
  lastSignInAt: string | null,
): PersonAccessState {
  if (!userId) return "rosterOnly";
  return lastSignInAt ? "active" : "invited";
}

/**
 * True when demoting, revoking or deactivating `targetUserId` would leave the
 * business with no active admin.
 *
 * This is the one way this screen could lock a salon out of its own tenant:
 * `memberships` RLS only lets an admin manage memberships, so a salon with
 * zero admins can never grant anyone access again without platform support.
 */
export function wouldRemoveLastAdmin(
  activeAdmins: { userId: string }[],
  targetUserId: string,
): boolean {
  return activeAdmins.length === 1 && activeAdmins[0]?.userId === targetUserId;
}
