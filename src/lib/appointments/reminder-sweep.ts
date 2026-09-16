import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import { notifyAppointmentEvent } from "./notify";
import { fetchReminderSettings } from "./queries";
import type { AppointmentStatus } from "./types";

export type ReminderCandidate = {
  startsAt: string;
  reminderSentAt: string | null;
  status: AppointmentStatus;
};

/** Pure predicate: is this appointment due for its timed reminder right now? */
export function isDueForReminder(
  appointment: ReminderCandidate,
  leadHours: number,
  now: Date,
): boolean {
  if (appointment.status !== "scheduled") return false;
  if (appointment.reminderSentAt) return false;
  const startsAt = new Date(appointment.startsAt).getTime();
  if (startsAt <= now.getTime()) return false;
  const leadWindowMs = leadHours * 60 * 60 * 1000;
  return startsAt - now.getTime() <= leadWindowMs;
}

export type SweepResult = { businessId: string; sent: number; skipped: number };

/**
 * One business's reminder sweep: finds `scheduled` appointments due for a
 * reminder, sends, and stamps `reminder_sent_at` (dedupe guard against
 * overlapping sweep runs). Called once per business with
 * `send_appointment_reminder = true` by the cron route.
 */
export async function sweepBusinessForReminders(
  supabase: SupabaseClient<Database>,
  businessId: string,
  now: Date = new Date(),
): Promise<SweepResult> {
  const settings = await fetchReminderSettings(supabase, businessId);
  if (!settings.sendReminder) return { businessId, sent: 0, skipped: 0 };

  const windowEnd = new Date(
    now.getTime() + settings.reminderLeadHours * 60 * 60 * 1000,
  ).toISOString();

  const { data: candidates, error } = await supabase
    .from("appointments")
    .select("id, starts_at, reminder_sent_at, status, customer_id, appointment_type_id")
    .eq("business_id", businessId)
    .eq("status", "scheduled")
    .is("reminder_sent_at", null)
    .gt("starts_at", now.toISOString())
    .lte("starts_at", windowEnd);
  if (error) throw error;

  let sent = 0;
  let skipped = 0;

  for (const appointment of candidates ?? []) {
    if (
      !isDueForReminder(
        {
          startsAt: appointment.starts_at,
          reminderSentAt: appointment.reminder_sent_at,
          status: appointment.status,
        },
        settings.reminderLeadHours,
        now,
      )
    ) {
      continue;
    }

    const [{ data: customer }, { data: type }] = await Promise.all([
      supabase
        .from("customers")
        .select("name, email, phone")
        .eq("id", appointment.customer_id)
        .maybeSingle(),
      supabase
        .from("appointment_types")
        .select("name")
        .eq("id", appointment.appointment_type_id)
        .maybeSingle(),
    ]);
    if (!customer || !type) {
      skipped++;
      continue;
    }

    await notifyAppointmentEvent({
      kind: "reminder",
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      appointmentTypeName: type.name,
      startsAt: appointment.starts_at,
      settings,
    });

    await supabase
      .from("appointments")
      .update({ reminder_sent_at: now.toISOString() })
      .eq("id", appointment.id);
    sent++;
  }

  return { businessId, sent, skipped };
}

/** Every business with reminders enabled -- the cron route's entry point. */
export async function sweepAllBusinessesForReminders(
  supabase: SupabaseClient<Database>,
  now: Date = new Date(),
): Promise<SweepResult[]> {
  const { data: businesses, error } = await supabase
    .from("business_settings")
    .select("business_id")
    .eq("send_appointment_reminder", true);
  if (error) throw error;

  const results: SweepResult[] = [];
  for (const row of businesses ?? []) {
    results.push(await sweepBusinessForReminders(supabase, row.business_id, now));
  }
  return results;
}
