"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/server";
import {
  InviteError,
  findOrInviteUser,
  normalizeEmail,
  resendInvite,
} from "@/lib/invites";
import { getSiteOrigin } from "@/lib/invites/site-origin";
import { can, isRole } from "@/lib/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { derivePersonAccessState, wouldRemoveLastAdmin } from "./guards";
import { fetchLastSignInAt, listActiveAdmins } from "./queries";
import {
  hasFieldErrors,
  validatePersonInput,
  type PersonFieldErrors,
  type PersonInput,
} from "./validation";

export type PersonActionResult =
  | { success: true }
  | { success: false; errors: PersonFieldErrors; formError?: string };

function failure(formError: string): PersonActionResult {
  return { success: false, errors: {}, formError };
}

function readInput(formData: FormData): PersonInput {
  return {
    fullName: String(formData.get("fullName") ?? ""),
    title: String(formData.get("title") ?? ""),
    defaultWorkStageId: String(formData.get("defaultWorkStageId") ?? ""),
    // An unchecked checkbox is simply absent from the FormData.
    isAssignable: formData.get("isAssignable") !== null,
    email: String(formData.get("email") ?? ""),
    role: String(formData.get("role") ?? ""),
  };
}

/**
 * The authoritative permission checks. RLS enforces tenant isolation; these
 * enforce *which role may do what*, so hiding a control in the UI is only ever
 * cosmetic (design spec, "Permissions").
 */
async function requireRosterManager() {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "manageStaff")) return null;
  return user;
}

async function requireAccessManager() {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "manageUsers")) return null;
  return user;
}

/** Revalidates every surface that renders an assignee picker. */
function revalidatePeople() {
  revalidatePath("/settings/people");
  revalidatePath("/board");
  revalidatePath("/sprint");
}

// ---------------------------------------------------------------------------
// Roster actions (`manageStaff`: admin + manager)
// ---------------------------------------------------------------------------

export async function createPersonAction(
  formData: FormData,
): Promise<PersonActionResult> {
  const user = await requireRosterManager();
  if (!user) return failure("forbidden");

  const input = readInput(formData);
  // Only an access manager may grant a login, so a manager's submission can
  // never carry one -- ignore rather than reject, since their form has no
  // access fields at all.
  const grantsAccess = can(user.role, "manageUsers");
  const scoped: PersonInput = grantsAccess
    ? input
    : { ...input, email: "", role: "" };

  const errors = validatePersonInput(scoped);
  if (hasFieldErrors(errors)) return { success: false, errors };

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("staff_members")
    .insert({
      business_id: user.businessId,
      full_name: scoped.fullName.trim(),
      title: scoped.title.trim() || null,
      default_work_stage_id: scoped.defaultWorkStageId || null,
      is_assignable: scoped.isAssignable,
    })
    .select("id")
    .single();
  if (error || !data) return failure("generic");

  if (scoped.email.trim() && scoped.role.trim()) {
    const granted = await grantAccess(user.businessId, data.id, {
      email: scoped.email,
      fullName: scoped.fullName,
      role: scoped.role,
    });
    if (!granted.success) return granted;
  }

  revalidatePeople();
  return { success: true };
}

export async function updatePersonAction(
  id: string,
  formData: FormData,
): Promise<PersonActionResult> {
  const user = await requireRosterManager();
  if (!user) return failure("forbidden");

  const input = readInput(formData);
  const errors = validatePersonInput({ ...input, email: "", role: "" });
  if (hasFieldErrors(errors)) return { success: false, errors };

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("staff_members")
    .update({
      full_name: input.fullName.trim(),
      title: input.title.trim() || null,
      default_work_stage_id: input.defaultWorkStageId || null,
      is_assignable: input.isAssignable,
    })
    .eq("id", id)
    .eq("business_id", user.businessId)
    .select("id");
  if (error) return failure("generic");
  // PostgREST reports no error when a filtered update matches nothing, so the
  // row count is the only signal that anything actually changed.
  if (!data || data.length === 0) return failure("notFound");

  revalidatePeople();
  return { success: true };
}

/**
 * Deactivate / reactivate. One switch, both halves: the person leaves every
 * assignee picker *and* loses their login, because "deactivate" means they
 * left the salon (design spec, "Deactivation is one switch").
 *
 * There is deliberately no delete -- the database withholds the grant
 * (20260830120000_staff_settings_rls.sql), so completed tasks keep their
 * assignee. Existing assignments are left untouched.
 */
export async function setPersonActiveAction(
  id: string,
  isActive: boolean,
): Promise<PersonActionResult> {
  const user = await requireRosterManager();
  if (!user) return failure("forbidden");

  const supabase = await createServerSupabaseClient();

  const { data: person, error: personError } = await supabase
    .from("staff_members")
    .select("id, user_id")
    .eq("id", id)
    .eq("business_id", user.businessId)
    .maybeSingle();
  if (personError) return failure("generic");
  if (!person) return failure("notFound");

  if (person.user_id && !isActive) {
    const admins = await listActiveAdmins(supabase, user.businessId);
    if (wouldRemoveLastAdmin(admins, person.user_id)) {
      return failure("lastAdmin");
    }
  }

  const { data, error } = await supabase
    .from("staff_members")
    .update({ is_active: isActive })
    .eq("id", id)
    .eq("business_id", user.businessId)
    .select("id");
  if (error) return failure("generic");
  if (!data || data.length === 0) return failure("notFound");

  // Only an access manager may touch memberships; a manager deactivating
  // someone leaves the login alone rather than failing the whole action.
  if (person.user_id && can(user.role, "manageUsers")) {
    const membership = await supabase
      .from("memberships")
      .update({ is_active: isActive })
      .eq("user_id", person.user_id)
      .eq("business_id", user.businessId);
    if (membership.error) return failure("generic");
  }

  revalidatePeople();
  return { success: true };
}

// ---------------------------------------------------------------------------
// Access actions (`manageUsers`: admin only)
// ---------------------------------------------------------------------------

/**
 * Invites (or finds) the user, links them to the roster row, and upserts the
 * membership.
 *
 * The link is written now, not on acceptance: the auth user exists as soon as
 * the invite is sent, so tasks assigned before they ever click the email are
 * waiting in My Work the first time they sign in (ADR 0013).
 */
async function grantAccess(
  businessId: string,
  personId: string,
  input: { email: string; fullName: string; role: string },
): Promise<PersonActionResult> {
  const role = input.role.trim();
  if (!isRole(role)) return failure("generic");

  const supabase = await createServerSupabaseClient();
  const admin = createAdminClient();
  const origin = await getSiteOrigin();

  let userId: string;
  try {
    const result = await findOrInviteUser(
      admin,
      { email: normalizeEmail(input.email), fullName: input.fullName.trim() },
      `${origin}/reset-password`,
    );
    userId = result.userId;
  } catch (error) {
    return failure(error instanceof InviteError ? error.code : "generic");
  }

  const membership = await supabase.from("memberships").upsert(
    {
      user_id: userId,
      business_id: businessId,
      role,
      // Re-inviting someone previously deactivated here restores their
      // access, not just their role.
      is_active: true,
    },
    { onConflict: "user_id,business_id" },
  );
  if (membership.error) return failure("generic");

  const linked = await supabase
    .from("staff_members")
    .update({ user_id: userId })
    .eq("id", personId)
    .eq("business_id", businessId)
    .select("id");
  if (linked.error) return failure("generic");
  if (!linked.data || linked.data.length === 0) return failure("notFound");

  return { success: true };
}

export async function invitePersonAction(
  personId: string,
  formData: FormData,
): Promise<PersonActionResult> {
  const user = await requireAccessManager();
  if (!user) return failure("forbidden");

  const email = String(formData.get("email") ?? "");
  const role = String(formData.get("role") ?? "");

  const supabase = await createServerSupabaseClient();
  const { data: person, error } = await supabase
    .from("staff_members")
    .select("id, full_name, user_id")
    .eq("id", personId)
    .eq("business_id", user.businessId)
    .maybeSingle();
  if (error) return failure("generic");
  if (!person) return failure("notFound");

  const errors = validatePersonInput({
    fullName: person.full_name,
    title: "",
    defaultWorkStageId: "",
    isAssignable: true,
    email,
    role,
  });
  if (hasFieldErrors(errors)) return { success: false, errors };

  const result = await grantAccess(user.businessId, personId, {
    email,
    fullName: person.full_name,
    role,
  });
  if (!result.success) return result;

  revalidatePeople();
  return { success: true };
}

/** Re-sends the invite email to the address already on the account. */
export async function reinvitePersonAction(
  personId: string,
): Promise<PersonActionResult> {
  const user = await requireAccessManager();
  if (!user) return failure("forbidden");

  const supabase = await createServerSupabaseClient();
  const { data: person, error } = await supabase
    .from("staff_members")
    .select("id, user_id")
    .eq("id", personId)
    .eq("business_id", user.businessId)
    .maybeSingle();
  if (error) return failure("generic");
  if (!person?.user_id) return failure("notFound");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", person.user_id)
    .maybeSingle();
  if (profileError) return failure("generic");
  if (!profile?.email) return failure("notFound");

  try {
    const origin = await getSiteOrigin();
    await resendInvite(
      createAdminClient(),
      profile.email,
      `${origin}/reset-password`,
    );
  } catch (error) {
    return failure(error instanceof InviteError ? error.code : "generic");
  }

  revalidatePeople();
  return { success: true };
}

/**
 * Corrects a mistyped invite address.
 *
 * Only while the person has never signed in -- after that the account is
 * theirs. The roster row and every task assigned to it are untouched, because
 * tasks hang off the roster row, not the login. The stale auth user is left in
 * place with its membership deactivated: deleting auth users is destructive and
 * has no undo, and a never-signed-in account with no active membership can
 * reach nothing.
 */
export async function correctEmailAction(
  personId: string,
  formData: FormData,
): Promise<PersonActionResult> {
  const user = await requireAccessManager();
  if (!user) return failure("forbidden");

  const email = String(formData.get("email") ?? "");

  const supabase = await createServerSupabaseClient();
  const { data: person, error } = await supabase
    .from("staff_members")
    .select("id, full_name, user_id")
    .eq("id", personId)
    .eq("business_id", user.businessId)
    .maybeSingle();
  if (error) return failure("generic");
  if (!person?.user_id) return failure("notFound");

  const { data: membership, error: membershipError } = await supabase
    .from("memberships")
    .select("role")
    .eq("user_id", person.user_id)
    .eq("business_id", user.businessId)
    .maybeSingle();
  if (membershipError) return failure("generic");
  if (!membership) return failure("notFound");

  const errors = validatePersonInput({
    fullName: person.full_name,
    title: "",
    defaultWorkStageId: "",
    isAssignable: true,
    email,
    role: membership.role,
  });
  if (hasFieldErrors(errors)) return { success: false, errors };

  const staleUserId = person.user_id;
  const signIns = await fetchLastSignInAt(createAdminClient(), [staleUserId]);
  if (
    derivePersonAccessState(staleUserId, signIns.get(staleUserId) ?? null) !==
    "invited"
  ) {
    return failure("alreadyAccepted");
  }

  const granted = await grantAccess(user.businessId, personId, {
    email,
    fullName: person.full_name,
    role: membership.role,
  });
  if (!granted.success) return granted;

  // Only after the new link is in place, and never if the corrected address
  // resolved back to the same account.
  const { data: relinked } = await supabase
    .from("staff_members")
    .select("user_id")
    .eq("id", personId)
    .maybeSingle();

  if (relinked?.user_id && relinked.user_id !== staleUserId) {
    const stale = await supabase
      .from("memberships")
      .update({ is_active: false })
      .eq("user_id", staleUserId)
      .eq("business_id", user.businessId);
    if (stale.error) return failure("generic");
  }

  revalidatePeople();
  return { success: true };
}

export async function changeRoleAction(
  personId: string,
  role: string,
): Promise<PersonActionResult> {
  const user = await requireAccessManager();
  if (!user) return failure("forbidden");
  if (!isRole(role)) return { success: false, errors: { role: "invalid" } };

  const supabase = await createServerSupabaseClient();
  const { data: person, error } = await supabase
    .from("staff_members")
    .select("id, user_id")
    .eq("id", personId)
    .eq("business_id", user.businessId)
    .maybeSingle();
  if (error) return failure("generic");
  if (!person?.user_id) return failure("notFound");

  if (role !== "admin") {
    const admins = await listActiveAdmins(supabase, user.businessId);
    if (wouldRemoveLastAdmin(admins, person.user_id)) {
      return failure("lastAdmin");
    }
  }

  // Plain RLS client: `memberships_update_admins` already permits exactly
  // this, so no service-role key is needed.
  const { data, error: updateError } = await supabase
    .from("memberships")
    .update({ role })
    .eq("user_id", person.user_id)
    .eq("business_id", user.businessId)
    .select("user_id");
  if (updateError) return failure("generic");
  if (!data || data.length === 0) return failure("notFound");

  revalidatePeople();
  return { success: true };
}

/** Removes the login but keeps the person on the roster and assignable. */
export async function revokeAccessAction(
  personId: string,
): Promise<PersonActionResult> {
  const user = await requireAccessManager();
  if (!user) return failure("forbidden");

  const supabase = await createServerSupabaseClient();
  const { data: person, error } = await supabase
    .from("staff_members")
    .select("id, user_id")
    .eq("id", personId)
    .eq("business_id", user.businessId)
    .maybeSingle();
  if (error) return failure("generic");
  if (!person?.user_id) return failure("notFound");

  const admins = await listActiveAdmins(supabase, user.businessId);
  if (wouldRemoveLastAdmin(admins, person.user_id)) return failure("lastAdmin");

  const { error: updateError } = await supabase
    .from("memberships")
    .update({ is_active: false })
    .eq("user_id", person.user_id)
    .eq("business_id", user.businessId);
  if (updateError) return failure("generic");

  revalidatePeople();
  return { success: true };
}
