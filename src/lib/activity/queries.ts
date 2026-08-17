import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import type { ActivityRow } from "./types";

export type ActivityEntry = ActivityRow & { actorName: string | null };

/** Work-order history section of the hub (docs/ui/work-order-hub.md). */
export async function fetchActivityForWorkOrder(
  supabase: SupabaseClient<Database>,
  workOrderId: string,
): Promise<ActivityEntry[]> {
  const { data, error } = await supabase
    .from("activity")
    .select("*")
    .eq("work_order_id", workOrderId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const rows = data ?? [];
  const actorIds = Array.from(
    new Set(
      rows
        .map((row) => row.actor_user_id)
        .filter((id): id is string => Boolean(id)),
    ),
  );

  let nameById = new Map<string, string>();
  if (actorIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", actorIds);
    if (profilesError) throw profilesError;
    nameById = new Map(
      (profiles ?? []).map((p) => [p.id, p.full_name ?? ""]),
    );
  }

  return rows.map((row) => ({
    ...row,
    actorName: row.actor_user_id
      ? (nameById.get(row.actor_user_id) ?? null)
      : null,
  }));
}
