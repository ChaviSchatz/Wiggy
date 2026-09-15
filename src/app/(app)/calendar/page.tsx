import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/layout/page-header";
import { listActiveAppointmentTypes } from "@/lib/appointment-types/queries";
import {
  listAppointmentsForAllStaffInRange,
  listAppointmentsForStaffInRange,
  listBookableStaff,
} from "@/lib/appointments/queries";
import { resolveViewableStaffMemberId } from "@/lib/appointments/guards";
import { getCurrentUser } from "@/lib/auth/server";
import { can } from "@/lib/roles";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { addCalendarDays, businessDateString, businessWallClockToUtc } from "@/lib/time/business-time";
import { searchCustomersAction } from "./search-customers-action";
import { AppointmentGrid, type GridColumn } from "./appointment-grid";
import { StaffSwitcher } from "./staff-switcher";

type SearchParams = { view?: string; date?: string; staff?: string };

/**
 * `[start, end)` as real UTC instants for one business-local calendar day --
 * `businessWallClockToUtc` for both edges, with `end` being the *next*
 * day's midnight rather than `23:59:59.999`, so the exclusive-upper-bound
 * `.lt("starts_at", end)` queries can't miss a slot in the last minute.
 */
function dayRange(date: string, timezone: string): { start: string; end: string } {
  return {
    start: businessWallClockToUtc(date, 0, 0, timezone).toISOString(),
    end: businessWallClockToUtc(addCalendarDays(date, 1), 0, 0, timezone).toISOString(),
  };
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const canManageAppointments = can(user.role, "manageAppointments");
  if (!canManageAppointments && !user.isBookable) redirect("/");

  const supabase = await createServerSupabaseClient();
  const [appointmentTypes, bookableStaff, customerOptions] = await Promise.all([
    listActiveAppointmentTypes(supabase, user.businessId),
    canManageAppointments ? listBookableStaff(supabase, user.businessId) : Promise.resolve([]),
    searchCustomersAction(""),
  ]);

  const date = searchParams.date ?? businessDateString(new Date(), user.timezone);
  const view = canManageAppointments ? (searchParams.view ?? "day") : "week";
  const t = await getTranslations("pages.calendar");

  const typeOptions = appointmentTypes.map((type) => ({
    id: type.id,
    name: type.name,
    defaultDurationMinutes: type.default_duration_minutes,
    color: type.color,
  }));

  if (view === "day") {
    const { start, end } = dayRange(date, user.timezone);
    const appointments = await listAppointmentsForAllStaffInRange(supabase, user.businessId, start, end);
    const columns: GridColumn[] = bookableStaff.map((person) => ({
      key: person.id,
      label: person.fullName,
      staffMemberId: person.id,
      date,
      appointments: appointments.filter((a) => a.staff_member_id === person.id),
    }));

    return (
      <div>
        <PageHeader title={t("title")} subtitle={t("daySubtitle")} />
        <AppointmentGrid
          columns={columns}
          timezone={user.timezone}
          canWrite
          customerOptions={customerOptions}
          appointmentTypeOptions={typeOptions}
        />
      </div>
    );
  }

  // Week view
  const staffMemberId = resolveViewableStaffMemberId({
    canManageAppointments,
    current: { staffMemberId: user.staffMemberId, isBookable: user.isBookable },
    requestedStaffMemberId: searchParams.staff ?? null,
    firstBookableStaffMemberId: bookableStaff[0]?.id ?? null,
  });
  if (!staffMemberId) redirect("/");

  const weekDates = weekDatesFor(date);
  // Same [start, next-day-after-last) shape as `dayRange`, spanning the
  // whole week rather than one day.
  const weekStart = businessWallClockToUtc(weekDates[0], 0, 0, user.timezone).toISOString();
  const weekEnd = businessWallClockToUtc(
    addCalendarDays(weekDates[weekDates.length - 1], 1),
    0,
    0,
    user.timezone,
  ).toISOString();
  const appointments = await listAppointmentsForStaffInRange(
    supabase,
    user.businessId,
    staffMemberId,
    weekStart,
    weekEnd,
  );
  const columns: GridColumn[] = weekDates.map((d) => ({
    key: d,
    label: new Date(d).toLocaleDateString("he-IL", { weekday: "short" }),
    staffMemberId,
    date: d,
    // Group by the appointment's business-local calendar date, not a raw
    // UTC-string prefix match -- an evening appointment can land on the
    // next UTC calendar date depending on the offset, which would silently
    // drop it from every column with a naive `startsWith` check.
    appointments: appointments.filter(
      (a) => businessDateString(new Date(a.starts_at), user.timezone) === d,
    ),
  }));

  return (
    <div>
      <PageHeader
        title={t("title")}
        subtitle={t("weekSubtitle")}
        actions={
          canManageAppointments ? (
            <StaffSwitcher staff={bookableStaff} selectedStaffMemberId={staffMemberId} />
          ) : undefined
        }
      />
      <AppointmentGrid
        columns={columns}
        timezone={user.timezone}
        canWrite={canManageAppointments}
        customerOptions={customerOptions}
        appointmentTypeOptions={typeOptions}
      />
    </div>
  );
}

/**
 * The 7 calendar dates (Sun-Sat) containing `anyDateInWeek`, as plain
 * 'YYYY-MM-DD' calendar arithmetic -- built on `addCalendarDays`, which does
 * its date math via `Date.UTC` rather than the server process's local
 * timezone, so this can't shift by a day depending on where the server runs.
 */
function weekDatesFor(anyDateInWeek: string): string[] {
  const [year, month, day] = anyDateInWeek.split("-").map(Number);
  const dayOfWeek = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  const sunday = addCalendarDays(anyDateInWeek, -dayOfWeek);
  return Array.from({ length: 7 }, (_, i) => addCalendarDays(sunday, i));
}
