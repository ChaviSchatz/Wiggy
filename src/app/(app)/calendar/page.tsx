import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/layout/page-header";
import { colorForName } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { listActiveAppointmentTypes } from "@/lib/appointment-types/queries";
import {
  listAppointmentsForAllStaffInRange,
  listAppointmentsForStaffInRange,
  listBookableStaff,
  type BookableStaffOption,
} from "@/lib/appointments/queries";
import { resolveViewableStaffMemberId } from "@/lib/appointments/guards";
import { getCurrentUser } from "@/lib/auth/server";
import { can } from "@/lib/roles";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { addCalendarDays, businessDateString, businessWallClockToUtc } from "@/lib/time/business-time";
import { cn } from "@/lib/utils";
import { searchCustomersAction } from "./search-customers-action";
import { AppointmentGrid, type GridColumn, type TeamGridColumn } from "./appointment-grid";
import { CalendarViewControls } from "./calendar-view-controls";

type ViewOption = "day" | "week";
type ScopeOption = "team" | "person";
type SearchParams = { view?: string; date?: string; staff?: string; scope?: string };

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

  const t = await getTranslations("pages.calendar");

  // A manageAppointments holder with nobody bookable yet has no calendar to
  // show in any view/scope combination -- send them to set one up instead of
  // rendering an empty grid.
  if (canManageAppointments && bookableStaff.length === 0) {
    return (
      <div>
        <PageHeader title={t("title")} />
        <EmptyState
          title={t("emptyStaff.title")}
          description={t("emptyStaff.description")}
          action={
            <Link
              href="/settings/people"
              className="text-body font-medium text-mauve-600 hover:underline"
            >
              {t("emptyStaff.link")}
            </Link>
          }
        />
      </div>
    );
  }

  const todayDate = businessDateString(new Date(), user.timezone);
  const date = searchParams.date ?? todayDate;

  // The TIME RANGE (day/week) is decoupled from the AUDIENCE (team/person).
  // Managers default to day+team (today's existing default); a plain worker
  // never gets a team view at all, no matter what the URL says -- they're
  // always locked to their own calendar, though they now also get the
  // day/week toggle.
  const view: ViewOption =
    searchParams.view === "day" || searchParams.view === "week"
      ? searchParams.view
      : canManageAppointments
        ? "day"
        : "week";
  const requestedScope: ScopeOption | null =
    searchParams.scope === "team" || searchParams.scope === "person" ? searchParams.scope : null;
  const scope: ScopeOption = canManageAppointments ? (requestedScope ?? "team") : "person";

  const typeOptions = appointmentTypes.map((type) => ({
    id: type.id,
    name: type.name,
    defaultDurationMinutes: type.default_duration_minutes,
    color: type.color,
  }));

  // Computed unconditionally (cheap, pure -- no DB call) so it's available
  // both for the week-view branches below and for the date-nav controls'
  // range label, which needs it regardless of which view is active.
  const weekDates = weekDatesFor(date);

  const controls = (
    <CalendarViewControls
      view={view}
      scope={scope}
      date={date}
      todayDate={todayDate}
      weekStart={weekDates[0]}
      weekEnd={weekDates[weekDates.length - 1]}
      selectedStaffMemberId={scope === "person" ? (searchParams.staff ?? user.staffMemberId ?? null) : null}
      bookableStaff={bookableStaff}
      canManageAppointments={canManageAppointments}
    />
  );

  if (scope === "team" && view === "day") {
    // Unchanged from the original single-mode calendar: all bookable staff,
    // one column each, for one day, bookable.
    const { start, end } = dayRange(date, user.timezone);
    const appointments = await listAppointmentsForAllStaffInRange(supabase, user.businessId, start, end);
    const columns: GridColumn[] = bookableStaff.map((person) => ({
      key: person.id,
      label: person.fullName,
      isStaffColumn: true,
      staffMemberId: person.id,
      date,
      appointments: appointments.filter((a) => a.staff_member_id === person.id),
    }));

    return (
      <div>
        <PageHeader title={t("title")} subtitle={t("daySubtitle")} actions={controls} />
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

  if (scope === "team" && view === "week") {
    // 7 day columns, each holding every bookable staff member's
    // appointments for that day, color-coded by staff and laid out
    // side-by-side when two people's appointments overlap. When
    // `canManageAppointments`, empty slots are clickable too -- the staff
    // member is chosen inside the dialog rather than by which column was
    // clicked, since a day column here isn't any one person's.
    const weekStart = businessWallClockToUtc(weekDates[0], 0, 0, user.timezone).toISOString();
    const weekEnd = businessWallClockToUtc(
      addCalendarDays(weekDates[weekDates.length - 1], 1),
      0,
      0,
      user.timezone,
    ).toISOString();
    const appointments = await listAppointmentsForAllStaffInRange(
      supabase,
      user.businessId,
      weekStart,
      weekEnd,
    );
    const columns: TeamGridColumn[] = weekDates.map((d) => ({
      key: d,
      label: new Date(d).toLocaleDateString("he-IL", { weekday: "short", day: "numeric" }),
      date: d,
      appointments: appointments.filter(
        (a) => businessDateString(new Date(a.starts_at), user.timezone) === d,
      ),
    }));

    return (
      <div>
        <PageHeader title={t("title")} subtitle={t("weekTeamSubtitle")} actions={controls} />
        <CalendarLegend staff={bookableStaff} heading={t("legendHeading")} />
        <AppointmentGrid
          mode="team"
          columns={columns}
          timezone={user.timezone}
          canWrite={canManageAppointments}
          customerOptions={canManageAppointments ? customerOptions : undefined}
          appointmentTypeOptions={canManageAppointments ? typeOptions : undefined}
          staffOptions={canManageAppointments ? bookableStaff : undefined}
        />
      </div>
    );
  }

  // scope === "person": one staff member's calendar, day or week.
  const staffMemberId = resolveViewableStaffMemberId({
    canManageAppointments,
    current: { staffMemberId: user.staffMemberId, isBookable: user.isBookable },
    requestedStaffMemberId: searchParams.staff ?? null,
    firstBookableStaffMemberId: bookableStaff[0]?.id ?? null,
  });
  if (!staffMemberId) redirect("/");

  const staffNameById = new Map(bookableStaff.map((s) => [s.id, s.fullName]));
  const columnLabel = staffNameById.get(staffMemberId) ?? user.fullName ?? "";

  if (view === "day") {
    // NEW: the day-view rendering machinery, but a single column for the
    // requested (or defaulted) staff member.
    const { start, end } = dayRange(date, user.timezone);
    const appointments = await listAppointmentsForStaffInRange(
      supabase,
      user.businessId,
      staffMemberId,
      start,
      end,
    );
    const columns: GridColumn[] = [
      {
        key: staffMemberId,
        label: columnLabel,
        isStaffColumn: true,
        staffMemberId,
        date,
        appointments,
      },
    ];

    return (
      <div>
        <PageHeader title={t("title")} subtitle={t("dayPersonSubtitle")} actions={controls} />
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

  // Week + person: unchanged from the original calendar's default view.
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
    label: new Date(d).toLocaleDateString("he-IL", { weekday: "short", day: "numeric" }),
    isStaffColumn: false,
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
      <PageHeader title={t("title")} subtitle={t("weekSubtitle")} actions={controls} />
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
 * The team-week mode's legend: staff name + color swatch, using the exact
 * same `colorForName` hash the `Avatar` component uses, so a person's
 * calendar color always matches their avatar color everywhere else.
 */
function CalendarLegend({
  staff,
  heading,
}: {
  staff: BookableStaffOption[];
  heading: string;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-4">
      <span className="text-meta font-medium text-muted">{heading}</span>
      {staff.map((person) => (
        <span key={person.id} className="flex items-center gap-1.5 text-meta text-ink">
          <span className={cn("size-3 rounded-full", colorForName(person.fullName))} aria-hidden />
          {person.fullName}
        </span>
      ))}
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
