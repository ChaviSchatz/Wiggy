"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/server";
import { can } from "@/lib/roles";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type BusinessSettingsResult =
  { success: true } | { success: false; error: string };

/**
 * Timezone is admin-only in the app layer, mirroring the RLS Slice 1a already
 * put on `businesses` (`businesses_update_admins`). Both gates exist on
 * purpose: RLS is the guardrail, the app check is the real permission.
 */
export async function setBusinessTimezoneAction(
  timezone: string,
): Promise<BusinessSettingsResult> {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "editBusinessSettings")) {
    return { success: false, error: "forbidden" };
  }

  // Reject anything the runtime does not recognise, so a hand-crafted request
  // cannot store a value that later breaks every date computation.
  if (!isValidTimeZone(timezone)) {
    return { success: false, error: "invalidTimezone" };
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("businesses")
    .update({ timezone })
    .eq("id", user.businessId)
    .select("id");
  if (error) return { success: false, error: "generic" };
  // RLS restricts this UPDATE to admins, so zero rows means the policy
  // rejected it rather than the row being missing.
  if (!data || data.length === 0) {
    return { success: false, error: "forbidden" };
  }

  revalidatePath("/settings/business");
  revalidatePath("/");
  revalidatePath("/sprint");
  return { success: true };
}

/**
 * The tenant's own display name (design-language.md "tenant identity"):
 * shown under the Wiggy wordmark in the side nav. Same admin-only gate as
 * timezone -- both are tenant-identity settings, not day-to-day operations.
 */
export async function setBusinessNameAction(
  name: string,
): Promise<BusinessSettingsResult> {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "editBusinessSettings")) {
    return { success: false, error: "forbidden" };
  }

  const trimmed = name.trim();
  if (!trimmed) {
    return { success: false, error: "empty" };
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("businesses")
    .update({ name: trimmed })
    .eq("id", user.businessId)
    .select("id");
  if (error) return { success: false, error: "generic" };
  if (!data || data.length === 0) {
    return { success: false, error: "forbidden" };
  }

  // The name renders in the side nav on every page.
  revalidatePath("/", "layout");
  revalidatePath("/settings/business");
  return { success: true };
}

function isValidTimeZone(timezone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}
