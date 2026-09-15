"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

/**
 * Header row above the calendar grid: a Day/Week view toggle (underline
 * tabs, same visual language as `SettingsTabs`) plus, for
 * `manageAppointments` holders only, a scope dropdown choosing between the
 * whole team and one staff member. A bookable-only worker gets the view
 * toggle but never the scope dropdown -- they only ever see their own
 * calendar, locked to `scope=person&staff=<self>` regardless of the URL.
 */
export function CalendarViewControls({
  view,
  scope,
  selectedStaffMemberId,
  bookableStaff,
  canManageAppointments,
}: {
  view: "day" | "week";
  scope: "team" | "person";
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
