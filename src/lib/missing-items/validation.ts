/**
 * Pure validation + status rules for missing items (docs/architecture.md §4.4,
 * screen inventory #29-#31). Framework-agnostic (no Next.js, no Supabase) so
 * it's directly unit-testable and shared by the create and handle dialogs.
 *
 * The four statuses are a lifecycle (open -> found -> ordered -> handled) but
 * deliberately not a ratchet: a salon corrects itself ("marked handled, the
 * top never turned up"), so any status may be set from any other. What the
 * transition does control is `handled_at`, which exists exactly while the
 * status is `handled`.
 */

export const MISSING_ITEM_KINDS = ["top", "skin", "material"] as const;
export type MissingItemKind = (typeof MISSING_ITEM_KINDS)[number];

export const MISSING_ITEM_STATUSES = [
  "open",
  "found",
  "ordered",
  "handled",
] as const;
export type MissingItemStatus = (typeof MISSING_ITEM_STATUSES)[number];

export function isMissingItemKind(value: string): value is MissingItemKind {
  return (MISSING_ITEM_KINDS as readonly string[]).includes(value);
}

export function isMissingItemStatus(value: string): value is MissingItemStatus {
  return (MISSING_ITEM_STATUSES as readonly string[]).includes(value);
}

/** Create input (screen inventory #31); status always starts at `open`. */
export type MissingItemInput = {
  workOrderId: string;
  kind: string;
  description: string;
  responsibleStaffMemberId: string;
  notes: string;
};

/** Handle-status input (screen inventory #30). */
export type MissingItemStatusInput = {
  status: string;
  responsibleStaffMemberId: string;
  notes: string;
};

export type MissingItemFieldErrors = Partial<
  Record<"workOrderId" | "kind" | "status", "required" | "invalid">
>;

export function validateMissingItemInput(
  input: MissingItemInput,
): MissingItemFieldErrors {
  const errors: MissingItemFieldErrors = {};

  if (!input.workOrderId.trim()) {
    errors.workOrderId = "required";
  }

  const kind = input.kind.trim();
  if (!kind) {
    errors.kind = "required";
  } else if (!isMissingItemKind(kind)) {
    errors.kind = "invalid";
  }

  return errors;
}

export function validateMissingItemStatusInput(
  input: MissingItemStatusInput,
): MissingItemFieldErrors {
  const errors: MissingItemFieldErrors = {};

  const status = input.status.trim();
  if (!status) {
    errors.status = "required";
  } else if (!isMissingItemStatus(status)) {
    errors.status = "invalid";
  }

  return errors;
}

/**
 * `handled_at` for a status change: stamped on the way into `handled`,
 * preserved if it was already handled, cleared on the way back out.
 */
export function handledAtFor(
  status: MissingItemStatus,
  existingHandledAt: string | null,
  now: Date,
): string | null {
  if (status !== "handled") return null;
  return existingHandledAt ?? now.toISOString();
}

export function hasFieldErrors(errors: MissingItemFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
