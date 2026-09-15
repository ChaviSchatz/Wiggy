"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { businessWallClockToUtc } from "@/lib/time/business-time";
import { cn } from "@/lib/utils";
import type { AppointmentListItem } from "@/lib/appointments/types";
import { AppointmentPopoverContent } from "./appointment-popover-content";

// Business-hours window for the grid (hardcoded for v1, not tenant-configurable).
// Half-hour rows, matching the mockups reviewed during brainstorming.
const GRID_START_HOUR = 8;
const GRID_END_HOUR = 20;
const SLOT_MINUTES = 30;
const ROW_HEIGHT_PX = 32;

export function minutesFromGridStart(iso: string, timezone: string): number {
  const date = new Date(iso);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return (hour - GRID_START_HOUR) * 60 + minute;
}

export function gridRows(): { hour: number }[] {
  const rows: { hour: number }[] = [];
  for (let hour = GRID_START_HOUR; hour < GRID_END_HOUR; hour++) rows.push({ hour });
  return rows;
}

export { GRID_START_HOUR, GRID_END_HOUR, SLOT_MINUTES, ROW_HEIGHT_PX };

export type GridColumn = {
  key: string;
  label: string;
  staffMemberId: string;
  date: string; // YYYY-MM-DD, business timezone
  appointments: AppointmentListItem[];
};

export function AppointmentGrid({
  columns,
  timezone,
  canWrite,
  customerOptions,
  appointmentTypeOptions,
}: {
  columns: GridColumn[];
  timezone: string;
  canWrite: boolean;
  customerOptions: { id: string; name: string; phone: string | null }[];
  appointmentTypeOptions: {
    id: string;
    name: string;
    defaultDurationMinutes: number | null;
    color: string | null;
  }[];
}) {
  const t = useTranslations("pages.calendar");
  const rows = gridRows();
  const totalHeight = rows.length * (60 / SLOT_MINUTES) * ROW_HEIGHT_PX;

  return (
    <div className="flex overflow-x-auto rounded-card border border-line bg-surface">
      <div className="w-14 shrink-0 border-e border-line text-end">
        <div className="h-9 border-b border-line" />
        {rows.map(({ hour }) => (
          <div
            key={hour}
            className="border-b border-line px-2 py-1 text-meta text-muted"
            style={{ height: (60 / SLOT_MINUTES) * ROW_HEIGHT_PX }}
          >
            {String(hour).padStart(2, "0")}:00
          </div>
        ))}
      </div>

      {columns.map((column) => (
        <div key={column.key} className="min-w-[9rem] flex-1 border-e border-line last:border-e-0">
          <div className="flex h-9 items-center justify-center border-b border-line px-2 text-body font-medium text-ink">
            {column.label}
          </div>
          <div className="relative" style={{ height: totalHeight }}>
            {canWrite ? (
              <EmptySlotButtons
                column={column}
                timezone={timezone}
                t={t}
                customerOptions={customerOptions}
                appointmentTypeOptions={appointmentTypeOptions}
              />
            ) : null}
            {column.appointments.map((appointment) => (
              <AppointmentBlock
                key={appointment.id}
                appointment={appointment}
                timezone={timezone}
                canWrite={canWrite}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptySlotButtons({
  column,
  timezone,
  t,
  customerOptions,
  appointmentTypeOptions,
}: {
  column: GridColumn;
  timezone: string;
  t: ReturnType<typeof useTranslations>;
  customerOptions: { id: string; name: string; phone: string | null }[];
  appointmentTypeOptions: {
    id: string;
    name: string;
    defaultDurationMinutes: number | null;
    color: string | null;
  }[];
}) {
  const rows = gridRows();
  const [openSlot, setOpenSlot] = useState<string | null>(null);

  return (
    <>
      {rows.flatMap(({ hour }) =>
        [0, SLOT_MINUTES].map((minuteOffset) => {
          const slotKey = `${hour}:${minuteOffset}`;
          const top =
            ((hour - GRID_START_HOUR) * 60 + minuteOffset) *
            (ROW_HEIGHT_PX / SLOT_MINUTES);

          // Computed via the timezone-aware helper, never a naive template
          // string -- a naive `${date}T${hour}:${minute}:00` would carry no
          // UTC offset and get misread using the DB connection's timezone
          // instead of this business's.
          const startsAtUtc = businessWallClockToUtc(
            column.date,
            hour,
            minuteOffset,
            timezone,
          ).toISOString();

          return (
            <Popover
              key={slotKey}
              open={openSlot === slotKey}
              onOpenChange={(next) => setOpenSlot(next ? slotKey : null)}
            >
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label={t("bookSlot")}
                  className="absolute inset-x-0 hover:bg-mauve-100/60"
                  style={{ top, height: ROW_HEIGHT_PX }}
                />
              </PopoverTrigger>
              <PopoverContent>
                <AppointmentPopoverContent
                  mode="create"
                  staffMemberId={column.staffMemberId}
                  initialStartsAtUtc={startsAtUtc}
                  customerOptions={customerOptions}
                  appointmentTypeOptions={appointmentTypeOptions}
                  onDone={() => setOpenSlot(null)}
                />
              </PopoverContent>
            </Popover>
          );
        }),
      )}
    </>
  );
}

function AppointmentBlock({
  appointment,
  timezone,
  canWrite,
}: {
  appointment: AppointmentListItem;
  timezone: string;
  canWrite: boolean;
}) {
  const [open, setOpen] = useState(false);
  const startMinutes = minutesFromGridStart(appointment.starts_at, timezone);
  const endMinutes = minutesFromGridStart(appointment.ends_at, timezone);
  const top = startMinutes * (ROW_HEIGHT_PX / SLOT_MINUTES);
  const height = Math.max(
    (endMinutes - startMinutes) * (ROW_HEIGHT_PX / SLOT_MINUTES),
    ROW_HEIGHT_PX / 2,
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "absolute inset-x-1 overflow-hidden rounded-xs border-s-2 bg-mauve-100 p-1 text-start text-meta text-ink",
          )}
          style={{
            top,
            height,
            borderInlineStartColor: appointment.appointmentTypeColor ?? undefined,
          }}
        >
          <p className="truncate font-medium">{appointment.appointmentTypeName}</p>
          <p className="truncate text-muted">{appointment.customerName}</p>
        </button>
      </PopoverTrigger>
      <PopoverContent>
        <AppointmentPopoverContent
          mode={canWrite ? "edit" : "view"}
          appointment={appointment}
          timezone={timezone}
          onDone={() => setOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );
}
