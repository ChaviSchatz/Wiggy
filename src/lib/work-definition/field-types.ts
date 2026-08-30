/**
 * The field types an intake form can render (screen inventory #52).
 *
 * `intake_template_items.field_type` has no database enum on purpose --
 * 20260803210000_work_definition_schema.sql says the fixed set is
 * "code-defined, to be validated in the app layer once the work-definition
 * domain module (and its [config] editors) is built". This is that module.
 *
 * Two consumers: the builder validates against it on write, and the intake
 * wizard (`src/app/(app)/orders/new/step-intake.tsx`) renders from it on
 * read. One source, so the two cannot drift.
 */

export const FIELD_TYPES = ["text", "textarea", "boolean", "select"] as const;

export type FieldType = (typeof FIELD_TYPES)[number];

/** What an item falls back to when `field_type` is null or unrecognised. */
export const DEFAULT_FIELD_TYPE: FieldType = "text";

export function isFieldType(
  value: string | null | undefined,
): value is FieldType {
  return (
    typeof value === "string" &&
    (FIELD_TYPES as readonly string[]).includes(value)
  );
}

/** Only `select` needs a value list; the others are free input. */
export function requiresOptions(type: FieldType): boolean {
  return type === "select";
}

/**
 * Reads the `options` jsonb column. It is untyped and tenant-owned, so
 * anything that is not a list of non-blank strings yields an empty list
 * rather than rendering junk into the form.
 */
export function parseOptions(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

/** Turns the config dialog's one-per-line textarea into the stored array. */
export function serializeOptions(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}
