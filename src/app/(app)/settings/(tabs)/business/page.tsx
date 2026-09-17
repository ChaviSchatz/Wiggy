import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/server";
import { fetchReminderSettings } from "@/lib/appointments/queries";
import { can } from "@/lib/roles";
import { fetchSprintCadenceDays } from "@/lib/sprints/queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { BusinessSettingsForm } from "./business-settings-form";

export default async function BusinessSettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Three gates: tenant identity (name, timezone) is admin-only (mirroring
  // the RLS on `businesses`), sprint cadence is a manager-level operational
  // setting, and appointment reminders are an appointments-operational
  // setting (managers and secretaries both run day-to-day appointment ops).
  const canEditTimezone = can(user.role, "editBusinessSettings");
  const canEditName = canEditTimezone;
  const canEditCadence = can(user.role, "planSprint");
  const canEditReminders = can(user.role, "manageAppointments");
  if (!canEditTimezone && !canEditCadence && !canEditReminders) redirect("/");

  const supabase = await createServerSupabaseClient();
  const cadenceDays = await fetchSprintCadenceDays(supabase, user.businessId);
  const reminderSettings = canEditReminders
    ? await fetchReminderSettings(supabase, user.businessId)
    : null;

  return (
    <BusinessSettingsForm
      businessName={user.businessName}
      timezone={user.timezone}
      cadenceDays={cadenceDays}
      reminderSettings={reminderSettings}
      canEditName={canEditName}
      canEditTimezone={canEditTimezone}
      canEditCadence={canEditCadence}
      canEditReminders={canEditReminders}
      // Resolved on the server and passed down, so the client never has to
      // care whether its runtime supports `Intl.supportedValuesOf`.
      timezones={Intl.supportedValuesOf("timeZone")}
    />
  );
}
