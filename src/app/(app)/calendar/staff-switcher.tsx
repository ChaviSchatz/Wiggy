"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

export function StaffSwitcher({
  staff,
  selectedStaffMemberId,
}: {
  staff: { id: string; fullName: string }[];
  selectedStaffMemberId: string;
}) {
  const t = useTranslations("pages.calendar");
  const router = useRouter();
  const searchParams = useSearchParams();

  function onChange(nextStaffId: string) {
    const params = new URLSearchParams(searchParams);
    params.set("staff", nextStaffId);
    router.push(`/calendar?${params.toString()}`);
  }

  return (
    <select
      aria-label={t("switchStaff")}
      value={selectedStaffMemberId}
      onChange={(event) => onChange(event.target.value)}
      className="h-9 rounded-control border border-line bg-surface px-2 text-body text-ink"
    >
      {staff.map((person) => (
        <option key={person.id} value={person.id}>
          {person.fullName}
        </option>
      ))}
    </select>
  );
}
