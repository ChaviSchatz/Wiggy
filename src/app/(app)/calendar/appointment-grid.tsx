"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { colorForName } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { computeOverlapLayout } from "@/lib/appointments/overlap-layout";
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

/**
 * A team-week day column: every bookable staff member's appointments for
 * that day, not one staff member's -- so unlike `GridColumn`, it carries no
 * single `staffMemberId`. When `canWrite` and `staffOptions` are provided,
 * empty slots are still clickable -- the staff member is chosen inside the
 * booking dialog instead of being predetermined by which shared column was
 * clicked.
 */
export type TeamGridColumn = {
  key: string;
  label: string;
  date: string;
  appointments: AppointmentListItem[];
};

type AppointmentGridProps =
  | {
      mode?: "single-staff";
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
    }
  | {
      mode: "team";
      columns: TeamGridColumn[];
      timezone: string;
      /** Still gates the appointment popover's edit/view mode, and (together
       * with the three options below) whether empty slots become clickable. */
      canWrite: boolean;
      /** Only needed/passed when `canWrite` -- omitted entirely for a
       * read-only viewer (e.g. a plain worker never reaches this mode). */
      customerOptions?: { id: string; name: string; phone: string | null }[];
      appointmentTypeOptions?: {
        id: string;
        name: string;
        defaultDurationMinutes: number | null;
        color: string | null;
      }[];
      staffOptions?: { id: string; fullName: string }[];
    };

export function AppointmentGrid(props: AppointmentGridProps) {
  const t = useTranslations("pages.calendar");
  const rows = gridRows();
  const totalHeight = rows.length * (60 / SLOT_MINUTES) * ROW_HEIGHT_PX;

  if (props.mode === "team") {
    const { columns, timezone, canWrite, customerOptions, appointmentTypeOptions, staffOptions } =
      props;
    const canBookFromTeamWeek =
      canWrite &&
      customerOptions !== undefined &&
      appointmentTypeOptions !== undefined &&
      staffOptions !== undefined;
    return (
      <div className="flex overflow-x-auto rounded-card border border-line bg-surface">
        <HourLabels rows={rows} />
        {columns.map((column) => {
          const layout = computeOverlapLayout(
            column.appointments.map((appointment) => ({
              id: appointment.id,
              startsAt: appointment.starts_at,
              endsAt: appointment.ends_at,
            })),
          );
          return (
            <div key={column.key} className="min-w-[9rem] flex-1 border-e border-line last:border-e-0">
              <div className="flex h-9 items-center justify-center border-b border-line px-2 text-body font-medium text-ink">
                {column.label}
              </div>
              <div className="relative" style={{ height: totalHeight }}>
                {canBookFromTeamWeek ? (
                  <TeamEmptySlotButtons
                    column={column}
                    timezone={timezone}
                    t={t}
                    customerOptions={customerOptions}
                    appointmentTypeOptions={appointmentTypeOptions}
                    staffOptions={staffOptions}
                  />
                ) : null}
                {column.appointments.map((appointment) => (
                  <TeamAppointmentBlock
                    key={appointment.id}
                    appointment={appointment}
                    timezone={timezone}
                    canWrite={canWrite}
                    placement={layout.get(appointment.id) ?? { column: 0, columnCount: 1 }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  const { columns, timezone, canWrite, customerOptions, appointmentTypeOptions } = props;
  return (
    <div className="flex overflow-x-auto rounded-card border border-line bg-surface">
      <HourLabels rows={rows} />
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

function HourLabels({ rows }: { rows: { hour: number }[] }) {
  return (
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
                  timezone={timezone}
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

/**
 * The team-week mode's empty-slot buttons: same half-hour slot geometry as
 * `EmptySlotButtons`, but the column is a shared day (no single
 * `staffMemberId`) so the booking dialog opens with no staff member
 * predetermined -- `staffOptions` lets the form's own picker choose one.
 */
function TeamEmptySlotButtons({
  column,
  timezone,
  t,
  customerOptions,
  appointmentTypeOptions,
  staffOptions,
}: {
  column: TeamGridColumn;
  timezone: string;
  t: ReturnType<typeof useTranslations>;
  customerOptions: { id: string; name: string; phone: string | null }[];
  appointmentTypeOptions: {
    id: string;
    name: string;
    defaultDurationMinutes: number | null;
    color: string | null;
  }[];
  staffOptions: { id: string; fullName: string }[];
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
                  staffMemberId={null}
                  staffOptions={staffOptions}
                  initialStartsAtUtc={startsAtUtc}
                  timezone={timezone}
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

/**
 * The team-week mode's appointment block: color comes from
 * `colorForName(staffMemberName)` (the same hash-based assignment the
 * `Avatar` component uses) instead of the appointment type's color, and its
 * width/offset come from `computeOverlapLayout`'s per-day placement so two
 * staff members' overlapping appointments render side-by-side instead of
 * stacking on top of each other.
 */
function TeamAppointmentBlock({
  appointment,
  timezone,
  canWrite,
  placement,
}: {
  appointment: AppointmentListItem;
  timezone: string;
  canWrite: boolean;
  placement: { column: number; columnCount: number };
}) {
  const [open, setOpen] = useState(false);
  const startMinutes = minutesFromGridStart(appointment.starts_at, timezone);
  const endMinutes = minutesFromGridStart(appointment.ends_at, timezone);
  const top = startMinutes * (ROW_HEIGHT_PX / SLOT_MINUTES);
  const height = Math.max(
    (endMinutes - startMinutes) * (ROW_HEIGHT_PX / SLOT_MINUTES),
    ROW_HEIGHT_PX / 2,
  );
  const { column, columnCount } = placement;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "absolute overflow-hidden rounded-xs p-1 text-start text-meta",
            colorForName(appointment.staffMemberName ?? ""),
          )}
          style={{
            top,
            height,
            insetInlineStart: `calc(${(column * 100) / columnCount}% + 2px)`,
            width: `calc(${100 / columnCount}% - 4px)`,
          }}
        >
          <p className="truncate font-medium">{appointment.staffMemberName}</p>
          <p className="truncate">{appointment.customerName}</p>
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
