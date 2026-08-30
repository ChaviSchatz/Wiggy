/**
 * Pure validation for the intake-template editor (screen inventory #50-52),
 * mirroring `src/lib/staff/validation.ts`.
 */

import { isFieldType, requiresOptions, serializeOptions } from "./field-types";

/**
 * The five order kinds. Fixed rather than tenant-defined: the value renders
 * through `t("kind.<value>")` and is the identity shown wherever an order has
 * no customer (board cards, My Work, approvals, the hub header), so an
 * invented value would surface as a raw message key. The tenant's free text
 * is the template *name*.
 */
export const WORK_ORDER_KINDS = [
  "customer",
  "display_wig",
  "internal",
  "missing_item",
  "repair",
] as const;

export type WorkOrderKind = (typeof WORK_ORDER_KINDS)[number];

export type IntakeItemKind = "task_type" | "task_group" | "field" | "section";

export function isWorkOrderKind(value: string): value is WorkOrderKind {
  return (WORK_ORDER_KINDS as readonly string[]).includes(value);
}

export type TemplateInput = {
  name: string;
  workOrderKind: string;
  description: string;
};

export type TemplateFieldErrors = Partial<
  Record<keyof TemplateInput, "required" | "invalid">
>;

export function validateTemplateInput(
  input: TemplateInput,
): TemplateFieldErrors {
  const errors: TemplateFieldErrors = {};
  if (!input.name.trim()) errors.name = "required";
  if (!isWorkOrderKind(input.workOrderKind)) errors.workOrderKind = "invalid";
  return errors;
}

export function hasTemplateErrors(errors: TemplateFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

export type ItemInput = {
  itemKind: IntakeItemKind;
  fieldLabel: string;
  /** Optional: the generator falls back `fieldLabel ?? fieldKey ?? id`. */
  fieldKey: string;
  fieldType: string;
  /** One value per line, as typed into the config dialog. */
  optionsText: string;
  sectionTitle: string;
};

export type ItemFieldErrors = Partial<
  Record<
    "fieldLabel" | "fieldType" | "options" | "sectionTitle",
    "required" | "invalid"
  >
>;

export function validateItemInput(input: ItemInput): ItemFieldErrors {
  const errors: ItemFieldErrors = {};

  if (input.itemKind === "field") {
    if (!input.fieldLabel.trim()) errors.fieldLabel = "required";

    if (!isFieldType(input.fieldType)) {
      errors.fieldType = "invalid";
    } else if (
      requiresOptions(input.fieldType) &&
      serializeOptions(input.optionsText).length === 0
    ) {
      errors.options = "required";
    }
  }

  if (input.itemKind === "section" && !input.sectionTitle.trim()) {
    errors.sectionTitle = "required";
  }

  // task_type / task_group carry no typed input -- the referent is chosen
  // from the catalog, and its config has only boolean/enum toggles.
  return errors;
}

export function hasItemErrors(errors: ItemFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
