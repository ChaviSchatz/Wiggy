/**
 * The calendar's safety rails, as pure predicates -- mirrors
 * `src/lib/people/guards.ts`: the rule that keeps a plain worker locked to
 * their own schedule lives here, testable without a database, and the
 * Server Actions/page loaders call it as the authoritative check (design
 * spec, "Screens & routes" -- "enforced server-side even if the URL is
 * hand-edited").
 */

export type CurrentStaffContext = {
  staffMemberId: string | null;
  isBookable: boolean;
};

/**
 * Which staff member's week the viewer is allowed to see.
 *
 * - `manageAppointments` holders may view anyone requested; with no request,
 *   they default to themselves (if bookable) or the first bookable person.
 * - Everyone else is locked to their own `staffMemberId`, no matter what was
 *   requested (e.g. a hand-edited `?staff=` URL param) -- `null` if they
 *   have no bookable staff row at all, meaning they have no calendar to see.
 */
export function resolveViewableStaffMemberId({
  canManageAppointments,
  current,
  requestedStaffMemberId,
  firstBookableStaffMemberId,
}: {
  canManageAppointments: boolean;
  current: CurrentStaffContext;
  requestedStaffMemberId: string | null;
  firstBookableStaffMemberId?: string | null;
}): string | null {
  if (canManageAppointments) {
    if (requestedStaffMemberId) return requestedStaffMemberId;
    if (current.isBookable && current.staffMemberId) return current.staffMemberId;
    return firstBookableStaffMemberId ?? null;
  }
  return current.isBookable ? current.staffMemberId : null;
}

/** Whether the viewer may create/edit/cancel appointments at all (not just view). */
export function canWriteAppointments(canManageAppointments: boolean): boolean {
  return canManageAppointments;
}
