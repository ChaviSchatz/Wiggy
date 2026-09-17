"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { addCalendarDays } from "@/lib/time/business-time";
import { cn } from "@/lib/utils";

/**
 * Header row above the calendar grid: a Day/Week view toggle (underline
 * tabs, same visual language as `SettingsTabs`), prev/today/next date
 * navigation plus a visible date/range label, and, for `manageAppointments`
 * holders only, a scope dropdown choosing between the whole team and one
 * staff member. A bookable-only worker gets the view toggle and the date
 * navigation but never the scope dropdown -- they only ever see their own
 * calendar, locked to `scope=person&staff=<self>` regardless of the URL.
 *
 * Date navigation is orthogonal to view/scope: every href here is built by
 * cloning the current search params and overwriting only `date`, exactly
 * like `hrefForView` already does for `view` -- so it works unchanged for
 * every view x scope combination, and switching Day/Week or team/person
 * never drops whatever `date` is already in the URL.
 */
export function CalendarViewControls({
  view,
  scope,
  date,
  todayDate,
  weekStart,
  weekEnd,
  selectedStaffMemberId,
  bookableStaff,
  canManageAppointments,
}: {
  view: "day" | "week";
  scope: "team" | "person";
  /** Current 'YYYY-MM-DD' business-local date, as resolved by the page. */
  date: string;
  /** Today's 'YYYY-MM-DD' business-local date -- the "Today" button's target. */
  todayDate: string;
  /** First/last 'YYYY-MM-DD' of the week containing `date` (`weekDatesFor`), for the week-view range label. */
  weekStart: string;
  weekEnd: string;
  selectedStaffMemberId: string | null;
  bookableStaff: { id: string; fullName: string }[];
  canManageAppointments: boolean;
}) {
  const t = useTranslations("pages.calendar");
  const router = useRouter();
  const searchParams = useSearchParams();

  function hrefForView(nextView: "day" | "week") {
    const params = new URLSearchParams(searchParams);
    params.set("view", nextView);
    return `/calendar?${params.toString()}`;
  }

  function hrefForDate(nextDate: string) {
    const params = new URLSearchParams(searchParams);
    params.set("date", nextDate);
    return `/calendar?${params.toString()}`;
  }

  function onScopeChange(value: string) {
    const params = new URLSearchParams(searchParams);
    if (value === "team") {
      params.set("scope", "team");
      params.delete("staff");
    } else {
      params.set("scope", "person");
      params.set("staff", value);
    }
    router.push(`/calendar?${params.toString()}`);
  }

  const viewTabs: { key: "day" | "week"; label: string }[] = [
    { key: "day", label: t("viewDay") },
    { key: "week", label: t("viewWeek") },
  ];

  // Day view steps by 1 calendar day; week view steps by a full 7-day week.
  // Both use `addCalendarDays` (Date.UTC-based, no server/browser-timezone
  // drift) on the plain 'YYYY-MM-DD' `date`, same as the page's own range
  // queries.
  const step = view === "day" ? 1 : 7;
  const previousHref = hrefForDate(addCalendarDays(date, -step));
  const nextHref = hrefForDate(addCalendarDays(date, step));
  const todayHref = hrefForDate(todayDate);

  const dateLabel =
    view === "day"
      ? new Intl.DateTimeFormat("he-IL", {
          weekday: "long",
          day: "numeric",
          month: "long",
        }).format(dateFromYMD(date))
      : new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "long" }).formatRange(
          dateFromYMD(weekStart),
          dateFromYMD(weekEnd),
        );

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div role="tablist" className="flex items-center gap-4 border-b border-line">
        {viewTabs.map((tab) => {
          const active = view === tab.key;
          return (
            <Link
              key={tab.key}
              href={hrefForView(tab.key)}
              role="tab"
              aria-selected={active}
              className={cn(
                "-mb-px border-b-2 pb-2 text-body transition-colors",
                active
                  ? "border-mauve-600 text-mauve-600"
                  : "border-transparent text-muted hover:text-ink",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" aria-label={t("previousLabel")} asChild>
          <Link href={previousHref}>
            <ChevronRight className="size-4" aria-hidden />
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={todayHref}>{t("today")}</Link>
        </Button>
        <Button variant="ghost" size="icon" aria-label={t("nextLabel")} asChild>
          <Link href={nextHref}>
            <ChevronLeft className="size-4" aria-hidden />
          </Link>
        </Button>
        <span className="text-body font-medium text-ink">{dateLabel}</span>
      </div>

      {canManageAppointments ? (
        <select
          aria-label={t("switchScope")}
          value={scope === "team" ? "team" : (selectedStaffMemberId ?? "")}
          onChange={(event) => onScopeChange(event.target.value)}
          className="h-9 rounded-control border border-line bg-surface px-2 text-body text-ink"
        >
          <option value="team">{t("wholeTeam")}</option>
          {bookableStaff.map((person) => (
            <option key={person.id} value={person.id}>
              {person.fullName}
            </option>
          ))}
        </select>
      ) : null}
    </div>
  );
}

/**
 * Parses a 'YYYY-MM-DD' business-local date string into a `Date` built from
 * local calendar components -- not `new Date(dateString)`, which parses as
 * UTC midnight and can print the wrong calendar day once formatted back
 * through the browser's own local zone. Since both this construction and
 * the `Intl.DateTimeFormat` calls above run in the same (browser-local)
 * zone with no explicit `timeZone` option, the zone cancels out and the
 * displayed calendar day always matches the string, regardless of where the
 * browser happens to be.
 */
function dateFromYMD(date: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
}
