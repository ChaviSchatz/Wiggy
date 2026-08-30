import type { SupabaseClient } from "@supabase/supabase-js";

import { LIVE_STATUSES } from "@/lib/board/queries";
import type { Database, Tables } from "@/lib/supabase/database.types";

export type StaffMember = Tables<"staff_members">;

export type StaffListItem = StaffMember & {
  workStageName: string | null;
  linkedUserName: string | null;
};

/**
 * Staff for the settings list (screen inventory #53), enriched with the
 * display names the table shows. Batched rather than embedded, matching
 * `src/lib/board/queries.ts`.
 *
 * Returns inactive members too -- the list has a "show inactive" toggle and
 * filters from this one result, because the set is small (a salon has tens
 * of staff, not thousands).
 */
export async function listStaffMembers(
  supabase: SupabaseClient<Database>,
  businessId: string,
): Promise<StaffListItem[]> {
  const { data: staff, error } = await supabase
    .from("staff_members")
    .select("*")
    .eq("business_id", businessId)
    .order("is_active", { ascending: false })
    .order("full_name", { ascending: true });
  if (error) throw error;

  const rows = staff ?? [];
  const stageIds = Array.from(
    new Set(
      rows
        .map((s) => s.default_work_stage_id)
        .filter((id): id is string => Boolean(id)),
    ),
  );
  const userIds = Array.from(
    new Set(
      rows.map((s) => s.user_id).filter((id): id is string => Boolean(id)),
    ),
  );

  const [stagesResult, profilesResult] = await Promise.all([
    stageIds.length > 0
      ? supabase.from("work_stages").select("id, name").in("id", stageIds)
      : Promise.resolve({ data: [], error: null }),
    userIds.length > 0
      ? supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", userIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (stagesResult.error) throw stagesResult.error;
  if (profilesResult.error) throw profilesResult.error;

  const stageNameById = new Map(
    (stagesResult.data ?? []).map((s) => [s.id, s.name]),
  );
  const profileById = new Map(
    (profilesResult.data ?? []).map((p) => [p.id, p]),
  );

  return rows.map((member) => {
    const profile = member.user_id
      ? profileById.get(member.user_id)
      : undefined;
    return {
      ...member,
      workStageName: member.default_work_stage_id
        ? (stageNameById.get(member.default_work_stage_id) ?? null)
        : null,
      linkedUserName: profile ? (profile.full_name ?? profile.email) : null,
    };
  });
}

/**
 * How many non-terminal tasks a staff member still holds. Shown in the
 * deactivate dialog: deactivation removes them from assignee pickers but
 * leaves these assigned, which is not self-evident.
 */
export async function countOpenTasksForStaff(
  supabase: SupabaseClient<Database>,
  businessId: string,
  staffMemberId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("runtime_tasks")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId)
    .eq("assigned_staff_member_id", staffMemberId)
    .in("status", LIVE_STATUSES);
  if (error) throw error;
  return count ?? 0;
}
