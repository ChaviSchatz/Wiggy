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

export type SweepResult = { businessId: string; sent: number; skipped: number; error?: string };

/**
 * One business's reminder sweep: finds `scheduled` appointments due for a
 * reminder, then for each one atomically claims it (a conditional update
 * that only succeeds while `reminder_sent_at` is still null) immediately
 * before sending -- this is what actually guards against overlapping sweep
 * runs (e.g. a slow sweep still in flight when the next cron tick fires):
 * only the invocation that wins the conditional update sends, the other
 * sees zero rows affected and moves on. The initial `select` below narrows
 * candidates but, on its own, can't prevent two concurrent sweeps from both
 * reading the same not-yet-claimed row. Called once per business with
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

    // Claim right before sending, not up front: a conditional update that
    // only matches while `reminder_sent_at` is still null. If a concurrent
    // sweep already claimed this appointment, zero rows come back and we
    // skip without double-sending; the lookups above never mutate state, so
    // doing them before the claim keeps a customer/type-lookup miss (above)
    // retryable on the next sweep instead of falsely marking it sent.
    const { data: claimed, error: claimError } = await supabase
      .from("appointments")
      .update({ reminder_sent_at: now.toISOString() })
      .eq("id", appointment.id)
      .is("reminder_sent_at", null)
      .select("id");
    if (claimError) {
      console.error(
        "[appointments/reminder-sweep] failed to claim appointment for reminder",
        claimError,
      );
      skipped++;
      continue;
    }
    if (!claimed || claimed.length === 0) {
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
    sent++;
  }

  return { businessId, sent, skipped };
}

/**
 * Every business with reminders enabled -- the cron route's entry point.
 * Each business's sweep is isolated: one business's failure (e.g. a
 * transient DB error) is logged and recorded on its own `SweepResult`
 * rather than aborting the loop, so a single bad tenant can't silently
 * skip every other tenant's reminders for this tick.
 */
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
    try {
      results.push(await sweepBusinessForReminders(supabase, row.business_id, now));
    } catch (sweepError) {
      console.error(
        `[appointments/reminder-sweep] sweep failed for business ${row.business_id}`,
        sweepError,
      );
      results.push({
        businessId: row.business_id,
        sent: 0,
        skipped: 0,
        error: sweepError instanceof Error ? sweepError.message : String(sweepError),
      });
    }
  }
  return results;
}
