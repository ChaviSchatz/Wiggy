import type { SupabaseClient } from "@supabase/supabase-js";

import { LIVE_STATUSES } from "@/lib/board/queries";
import { rankAfter } from "@/lib/queue/rank";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Computes the `queue_rank` for a task newly assigned to `staffMemberId`:
 * append after that employee's current last-ranked live task (or `firstRank()`
 * if their queue is empty). Shared by Sprint Planning's assign action and the
 * Board's tap-avatar reassign, so a task lands in a sane spot regardless of
 * which surface assigned it (see the Bug 2 fix note in board/actions.ts).
 */
export async function computeAppendRank(
  supabase: SupabaseClient<Database>,
  businessId: string,
  staffMemberId: string,
): Promise<number> {
  const { data: lastRanked } = await supabase
    .from("runtime_tasks")
    .select("queue_rank")
    .eq("business_id", businessId)
    .eq("assigned_staff_member_id", staffMemberId)
    .in("status", LIVE_STATUSES)
    .order("queue_rank", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  return rankAfter(lastRanked?.queue_rank ?? null);
}
