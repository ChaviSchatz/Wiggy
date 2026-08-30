import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import type {
  ActivityPayload,
  ActivitySubjectType,
  ActivityVerb,
} from "./types";

export type LogActivityInput = {
  businessId: string;
  actorUserId: string | null;
  verb: ActivityVerb;
  subjectType: ActivitySubjectType;
  subjectId: string;
  workOrderId?: string | null;
  customerId?: string | null;
  payload?: ActivityPayload;
};

/**
 * Writes one row to the unified `activity` stream (ADR 0004). Every
 * task/order transition in this slice calls this after its own mutation
 * succeeds. Best-effort: a logging failure is swallowed (logged to the
 * server console) rather than failing the user-visible action -- the
 * transition itself already committed, and losing one history line is far
 * better than reporting a false failure for a real state change.
 */
export async function logActivity(
  supabase: SupabaseClient<Database>,
  input: LogActivityInput,
): Promise<void> {
  const { error } = await supabase.from("activity").insert({
    business_id: input.businessId,
    actor_user_id: input.actorUserId,
    verb: input.verb,
    subject_type: input.subjectType,
    subject_id: input.subjectId,
    work_order_id: input.workOrderId ?? null,
    customer_id: input.customerId ?? null,
    // `ActivityPayload` is intentionally loose (Record<string, unknown>) for
    // callers; the jsonb column accepts anything JSON-serializable, so this
    // cast just bridges the generated `Json` type at the actual DB boundary.
    payload: (input.payload ??
      {}) as Database["public"]["Tables"]["activity"]["Insert"]["payload"],
  });
  if (error) {
    console.error("logActivity failed", { verb: input.verb, error });
  }
}
