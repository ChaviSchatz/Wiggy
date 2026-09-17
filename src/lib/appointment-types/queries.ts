import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Tables } from "@/lib/supabase/database.types";

export type AppointmentType = Tables<"appointment_types">;

/** Every appointment type for a business, active and inactive, sorted for editing. */
export async function listAppointmentTypes(
  supabase: SupabaseClient<Database>,
  businessId: string,
): Promise<AppointmentType[]> {
  const { data, error } = await supabase
    .from("appointment_types")
    .select("*")
    .eq("business_id", businessId)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/** Active-only, for the booking popover's type picker. */
export async function listActiveAppointmentTypes(
  supabase: SupabaseClient<Database>,
  businessId: string,
): Promise<AppointmentType[]> {
  const types = await listAppointmentTypes(supabase, businessId);
  return types.filter((type) => type.is_active);
}
