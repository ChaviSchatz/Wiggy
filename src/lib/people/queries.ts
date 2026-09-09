import type { SupabaseClient } from "@supabase/supabase-js";

import { LIVE_STATUSES } from "@/lib/board/queries";
import type { InviteAdminClient } from "@/lib/invites";
import { isRole, type Role } from "@/lib/roles";
import type { Database, Tables } from "@/lib/supabase/database.types";

export type Person = Tables<"staff_members">;

export type PersonListItem = Person & {
  workStageName: string | null;
  /** Display name of the linked login, if any. */
  linkedUserName: string | null;
  linkedEmail: string | null;
  role: Role | null;
  /** False when the login exists but its membership was revoked. */
  membershipActive: boolean;
};

type StageRow = { id: string; name: string };
type ProfileRow = { id: string; full_name: string | null; email: string | null };
type MembershipRow = { user_id: string; role: string; is_active: boolean };

/**
 * Joins one roster row to the login that may hang off it.
 *
 * Exported for its own unit test: this mapping is where a person with no
 * login, a dangling stage reference, or an unrecognised role stored as plain
 * text all have to degrade to `null` rather than throw.
 */
export function toPersonListItem(
  person: Person,
  lookups: {
    stageNameById: Map<string, string>;
    profileById: Map<string, ProfileRow>;
    membershipByUserId: Map<string, MembershipRow>;
  },
): PersonListItem {
  const profile = person.user_id
    ? lookups.profileById.get(person.user_id)
    : undefined;
  const membership = person.user_id
    ? lookups.membershipByUserId.get(person.user_id)
    : undefined;

  return {
    ...person,
    workStageName: person.default_work_stage_id
      ? (lookups.stageNameById.get(person.default_work_stage_id) ?? null)
      : null,
    linkedUserName: profile ? (profile.full_name ?? profile.email) : null,
    linkedEmail: profile?.email ?? null,
    // `memberships.role` is plain text in the schema, so an unknown value is
    // possible in principle and must not crash the whole list.
    role: membership && isRole(membership.role) ? membership.role : null,
    membershipActive: membership?.is_active ?? false,
  };
}

/**
 * Every person in the salon, roster-only and logged-in alike (ADR 0013).
 *
 * Batched rather than embedded, matching `src/lib/board/queries.ts`. Returns
 * inactive people too -- the list has a "show inactive" toggle and filters
 * from this one result, because a salon has tens of people, not thousands.
 */
export async function listPeople(
  supabase: SupabaseClient<Database>,
  businessId: string,
): Promise<PersonListItem[]> {
  const { data: people, error } = await supabase
    .from("staff_members")
    .select("*")
    .eq("business_id", businessId)
    .order("is_active", { ascending: false })
    .order("full_name", { ascending: true });
  if (error) throw error;

  const rows = people ?? [];
  const stageIds = Array.from(
    new Set(
      rows
        .map((p) => p.default_work_stage_id)
        .filter((id): id is string => Boolean(id)),
    ),
  );
  const userIds = Array.from(
    new Set(rows.map((p) => p.user_id).filter((id): id is string => Boolean(id))),
  );

  const [stagesResult, profilesResult, membershipsResult] = await Promise.all([
    stageIds.length > 0
      ? supabase.from("work_stages").select("id, name").in("id", stageIds)
      : Promise.resolve({ data: [] as StageRow[], error: null }),
    userIds.length > 0
      ? supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", userIds)
      : Promise.resolve({ data: [] as ProfileRow[], error: null }),
    userIds.length > 0
      ? supabase
          .from("memberships")
          .select("user_id, role, is_active")
          .eq("business_id", businessId)
          .in("user_id", userIds)
      : Promise.resolve({ data: [] as MembershipRow[], error: null }),
  ]);
  if (stagesResult.error) throw stagesResult.error;
  if (profilesResult.error) throw profilesResult.error;
  if (membershipsResult.error) throw membershipsResult.error;

  const lookups = {
    stageNameById: new Map(
      (stagesResult.data ?? []).map((s) => [s.id, s.name]),
    ),
    profileById: new Map((profilesResult.data ?? []).map((p) => [p.id, p])),
    membershipByUserId: new Map(
      (membershipsResult.data ?? []).map((m) => [m.user_id, m]),
    ),
  };

  return rows.map((person) => toPersonListItem(person, lookups));
}

/**
 * The user ids of every active admin in the business, for the last-admin
 * rail (`wouldRemoveLastAdmin`).
 */
export async function listActiveAdmins(
  supabase: SupabaseClient<Database>,
  businessId: string,
): Promise<{ userId: string }[]> {
  const { data, error } = await supabase
    .from("memberships")
    .select("user_id")
    .eq("business_id", businessId)
    .eq("role", "admin")
    .eq("is_active", true);
  if (error) throw error;
  return (data ?? []).map((row) => ({ userId: row.user_id }));
}

/**
 * When each linked user last signed in, for the Invited badge.
 *
 * Never throws: a badge must not be able to take down the People page, so a
 * failed lookup degrades to `null`, which reads as "invited"
 * (`derivePersonAccessState`).
 */
export async function fetchLastSignInAt(
  admin: InviteAdminClient,
  userIds: string[],
): Promise<Map<string, string | null>> {
  const entries = await Promise.all(
    userIds.map(async (userId): Promise<[string, string | null]> => {
      try {
        const { data, error } = await admin.auth.admin.getUserById(userId);
        if (error) return [userId, null];
        return [userId, data.user?.last_sign_in_at ?? null];
      } catch {
        return [userId, null];
      }
    }),
  );
  return new Map(entries);
}

/**
 * How many non-terminal tasks a person still holds. Shown in the deactivate
 * dialog: deactivation removes them from assignee pickers but leaves these
 * assigned, which is not self-evident.
 */
export async function countOpenTasksForPerson(
  supabase: SupabaseClient<Database>,
  businessId: string,
  personId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("runtime_tasks")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId)
    .eq("assigned_staff_member_id", personId)
    .in("status", LIVE_STATUSES);
  if (error) throw error;
  return count ?? 0;
}
