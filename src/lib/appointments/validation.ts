import type { AppointmentStatus } from "./types";

/** `undefined` means valid; otherwise the field-error code. */
export function validateAppointmentTimes(
  startsAt: string,
  endsAt: string,
): "invalid" | undefined {
  return new Date(endsAt).getTime() > new Date(startsAt).getTime()
    ? undefined
    : "invalid";
}

export type TimeSlot = { startsAt: string; endsAt: string };

/** Whether two time slots overlap at all (touching endpoints do not count). */
export function appointmentsOverlap(a: TimeSlot, b: TimeSlot): boolean {
  const aStart = new Date(a.startsAt).getTime();
  const aEnd = new Date(a.endsAt).getTime();
  const bStart = new Date(b.startsAt).getTime();
  const bEnd = new Date(b.endsAt).getTime();
  return aStart < bEnd && bStart < aEnd;
}

const TERMINAL_STATUSES: readonly AppointmentStatus[] = [
  "completed",
  "cancelled",
  "no_show",
];

/**
 * Status is one-way: 'scheduled' may move to any terminal status (or stay
 * 'scheduled', for a reschedule/edit); a terminal status never moves again
 * (design spec, "Booking flow & state transitions" -- "all three are
 * terminal").
 */
export function canTransitionStatus(
  from: AppointmentStatus,
  to: AppointmentStatus,
): boolean {
  if (from !== "scheduled") return false;
  return to === "scheduled" || TERMINAL_STATUSES.includes(to);
}
