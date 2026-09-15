import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import type { Appointment, AppointmentListItem } from "./types";

type CustomerRow = { id: string; name: string };
type StaffRow = { id: string; full_name: string };
type AppointmentTypeRow = { id: string; name: string; color: string | null };

/** Joins raw appointment rows to the display data every surface needs. */
export function toAppointmentListItems(
  rows: Appointment[],
  lookups: {
    customerById: Map<string, CustomerRow>;
    staffById: Map<string, StaffRow>;
    typeById: Map<string, AppointmentTypeRow>;
  },
): AppointmentListItem[] {
  return rows.map((row) => ({
    ...row,
    customerName: lookups.customerById.get(row.customer_id)?.name ?? "",
    staffMemberName: row.staff_member_id
      ? (lookups.staffById.get(row.staff_member_id)?.full_name ?? null)
      : null,
    appointmentTypeName:
      lookups.typeById.get(row.appointment_type_id)?.name ?? "",
    appointmentTypeColor:
      lookups.typeById.get(row.appointment_type_id)?.color ?? null,
  }));
}

async function enrichAppointments(
  supabase: SupabaseClient<Database>,
  rows: Appointment[],
): Promise<AppointmentListItem[]> {
  if (rows.length === 0) return [];

  const customerIds = Array.from(new Set(rows.map((r) => r.customer_id)));
  const staffIds = Array.from(
    new Set(rows.map((r) => r.staff_member_id).filter((id): id is string => Boolean(id))),
  );
  const typeIds = Array.from(new Set(rows.map((r) => r.appointment_type_id)));

  const [customers, staff, types] = await Promise.all([
    supabase.from("customers").select("id, name").in("id", customerIds),
    staffIds.length > 0
      ? supabase.from("staff_members").select("id, full_name").in("id", staffIds)
      : Promise.resolve({ data: [] as StaffRow[], error: null }),
    supabase
      .from("appointment_types")
      .select("id, name, color")
      .in("id", typeIds),
  ]);
  if (customers.error) throw customers.error;
  if (staff.error) throw staff.error;
  if (types.error) throw types.error;

  return toAppointmentListItems(rows, {
    customerById: new Map((customers.data ?? []).map((c) => [c.id, c])),
    staffById: new Map((staff.data ?? []).map((s) => [s.id, s])),
    typeById: new Map((types.data ?? []).map((t) => [t.id, t])),
  });
}

/** Every `scheduled` appointment for one staff member within [rangeStart, rangeEnd). Used by both day and week views. */
export async function listAppointmentsForStaffInRange(
  supabase: SupabaseClient<Database>,
  businessId: string,
  staffMemberId: string,
  rangeStart: string,
  rangeEnd: string,
): Promise<AppointmentListItem[]> {
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("business_id", businessId)
    .eq("staff_member_id", staffMemberId)
    .eq("status", "scheduled")
    .gte("starts_at", rangeStart)
    .lt("starts_at", rangeEnd)
    .order("starts_at", { ascending: true });
  if (error) throw error;
  return enrichAppointments(supabase, data ?? []);
}

/** Every `scheduled` appointment for every bookable staff member on one day (the all-staff day view). */
export async function listAppointmentsForAllStaffInRange(
  supabase: SupabaseClient<Database>,
  businessId: string,
  rangeStart: string,
  rangeEnd: string,
): Promise<AppointmentListItem[]> {
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("business_id", businessId)
    .eq("status", "scheduled")
    .not("staff_member_id", "is", null)
    .gte("starts_at", rangeStart)
    .lt("starts_at", rangeEnd)
    .order("starts_at", { ascending: true });
  if (error) throw error;
  return enrichAppointments(supabase, data ?? []);
}

export type BookableStaffOption = { id: string; fullName: string };

/** Bookable staff for the day view's columns and the week view's switcher. */
export async function listBookableStaff(
  supabase: SupabaseClient<Database>,
  businessId: string,
): Promise<BookableStaffOption[]> {
  const { data, error } = await supabase
    .from("staff_members")
    .select("id, full_name")
    .eq("business_id", businessId)
    .eq("is_bookable", true)
    .eq("is_active", true)
    .order("full_name", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({ id: row.id, fullName: row.full_name }));
}

/** The nearest upcoming `scheduled` appointment for a work order -- board badge + hub. */
export async function fetchNearestUpcomingAppointmentForOrder(
  supabase: SupabaseClient<Database>,
  businessId: string,
  workOrderId: string,
): Promise<AppointmentListItem | null> {
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("business_id", businessId)
    .eq("work_order_id", workOrderId)
    .eq("status", "scheduled")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const [enriched] = await enrichAppointments(supabase, [data]);
  return enriched ?? null;
}

/** Every appointment (any status) linked to a work order, for the Hub's Meetings section. */
export async function listAppointmentsForOrder(
  supabase: SupabaseClient<Database>,
  businessId: string,
  workOrderId: string,
): Promise<AppointmentListItem[]> {
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("business_id", businessId)
    .eq("work_order_id", workOrderId)
    .order("starts_at", { ascending: false });
  if (error) throw error;
  return enrichAppointments(supabase, data ?? []);
}

/** Existing `scheduled` appointments for a staff member overlapping a slot (double-booking warning). Excludes `excludeAppointmentId` itself, for reschedules. */
export async function listOverlappingAppointments(
  supabase: SupabaseClient<Database>,
  businessId: string,
  staffMemberId: string,
  startsAt: string,
  endsAt: string,
  excludeAppointmentId?: string,
): Promise<AppointmentListItem[]> {
  let query = supabase
    .from("appointments")
    .select("*")
    .eq("business_id", businessId)
    .eq("staff_member_id", staffMemberId)
    .eq("status", "scheduled")
    .lt("starts_at", endsAt)
    .gt("ends_at", startsAt);
  if (excludeAppointmentId) query = query.neq("id", excludeAppointmentId);

  const { data, error } = await query;
  if (error) throw error;
  return enrichAppointments(supabase, data ?? []);
}

export type ReminderSettings = {
  sendConfirmation: boolean;
  sendReminder: boolean;
  reminderLeadHours: number;
  emailEnabled: boolean;
  whatsappEnabled: boolean;
};

const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  sendConfirmation: true,
  sendReminder: false,
  reminderLeadHours: 24,
  emailEnabled: true,
  whatsappEnabled: false,
};

/** Tenant reminder configuration, defaulting like `fetchSprintCadenceDays` does when no row exists yet. */
export async function fetchReminderSettings(
  supabase: SupabaseClient<Database>,
  businessId: string,
): Promise<ReminderSettings> {
  const { data, error } = await supabase
    .from("business_settings")
    .select(
      "send_appointment_confirmation, send_appointment_reminder, appointment_reminder_lead_hours, appointment_reminder_email_enabled, appointment_reminder_whatsapp_enabled",
    )
    .eq("business_id", businessId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return DEFAULT_REMINDER_SETTINGS;
  return {
    sendConfirmation: data.send_appointment_confirmation,
    sendReminder: data.send_appointment_reminder,
    reminderLeadHours: data.appointment_reminder_lead_hours,
    emailEnabled: data.appointment_reminder_email_enabled,
    whatsappEnabled: data.appointment_reminder_whatsapp_enabled,
  };
}
