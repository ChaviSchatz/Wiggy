/**
 * Pure validation for the intake-template editor (screen inventory #50-52),
 * mirroring `src/lib/staff/validation.ts`.
 */

import { isFieldType, requiresOptions, serializeOptions } from "./field-types";

export type IntakeItemKind = "task_type" | "task_group" | "field" | "section";

export type TemplateInput = {
  name: string;
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
