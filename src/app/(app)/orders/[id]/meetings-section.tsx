import { useTranslations } from "next-intl";

import { Panel } from "@/components/ui/panel";
import type { AppointmentListItem } from "@/lib/appointments/types";

/**
 * Read-only list of appointments linked to this work order -- no dialog
 * here, since booking/editing appointments happens on `/calendar` (see
 * `appointment-popover-content.tsx`). Mirrors `HistorySection`'s pattern of
 * a client-hook `useTranslations` call in a component with no
 * `"use client"` directive.
 */
export function MeetingsSection({
  appointments,
}: {
  appointments: AppointmentListItem[];
}) {
  const t = useTranslations("pages.orders.detail.hub.meetings");

  return (
    <Panel title={t("title")} bodyClassName="space-y-3">
      {appointments.length === 0 ? (
        <p className="text-sm text-muted">{t("empty")}</p>
      ) : (
        <ul className="space-y-2">
          {appointments.map((appointment) => (
            <li key={appointment.id} className="flex items-center justify-between gap-2 text-sm">
              <span className="text-ink">
                {[appointment.appointmentTypeName, appointment.staffMemberName]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
              <span className="text-muted tabular-nums">
                {new Date(appointment.starts_at).toLocaleString("he-IL")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
