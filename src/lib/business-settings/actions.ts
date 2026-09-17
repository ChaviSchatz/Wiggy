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

/**
 * WhatsApp reminders cannot actually be sent until a provider exists
 * (src/lib/appointments/notify.ts, added in a later task). Until then we
 * reject rather than silently storing a setting that will never do anything.
 */
const WHATSAPP_HARD_DISABLED_UNTIL_PROVIDER_EXISTS = false;

/**
 * Appointment reminder/confirmation configuration. Gated by
 * `manageAppointments` (not `editBusinessSettings`) since this is an
 * appointments-operational setting, not tenant-identity -- managers and
 * secretaries run day-to-day appointment ops and need to be able to tune it.
 */
export async function setAppointmentReminderSettingsAction(input: {
  sendConfirmation: boolean;
  sendReminder: boolean;
  reminderLeadHours: number;
  emailEnabled: boolean;
  whatsappEnabled: boolean;
}): Promise<BusinessSettingsResult> {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "manageAppointments")) {
    return { success: false, error: "forbidden" };
  }
  // Only validated when reminders are actually on -- the lead-hours field is
  // hidden in the UI once `sendReminder` is unchecked, so rejecting a
  // stale/invalid value the user can no longer see or fix would block an
  // unrelated save (e.g. just toggling email off) with no visible cause.
  if (input.sendReminder) {
    if (!Number.isInteger(input.reminderLeadHours) || input.reminderLeadHours < 1) {
      return { success: false, error: "invalidLeadHours" };
    }
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("business_settings").upsert({
    business_id: user.businessId,
    send_appointment_confirmation: input.sendConfirmation,
    send_appointment_reminder: input.sendReminder,
    // Omitted (not just skipped-validation) when reminders are off, so a
    // save made with the field hidden can never overwrite an already-saved
    // lead time with a stale or invalid value the user isn't looking at --
    // an existing row keeps its prior value; a fresh row gets the column's
    // own schema default (24).
    ...(input.sendReminder
      ? { appointment_reminder_lead_hours: input.reminderLeadHours }
      : {}),
    appointment_reminder_email_enabled: input.emailEnabled,
    appointment_reminder_whatsapp_enabled:
      WHATSAPP_HARD_DISABLED_UNTIL_PROVIDER_EXISTS && input.whatsappEnabled,
  });
  if (error) return { success: false, error: "generic" };

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
