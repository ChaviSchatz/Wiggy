/**
 * Pure validation for staff create/edit input (screen inventory #53).
 * Framework-agnostic, mirroring `src/lib/customers/validation.ts`.
 *
 * Only `full_name` is required: `title` and `default_work_stage_id` are
 * nullable in the schema, and `user_id` is not editable here -- linking a
 * login to a staff member is screen #54, which needs invite/auth flows.
 */

const MAX_NAME_LENGTH = 120;

export type StaffInput = {
  fullName: string;
  title: string;
  defaultWorkStageId: string;
};

export type StaffFieldErrors = Partial<
  Record<keyof StaffInput, "required" | "tooLong">
>;

export function validateStaffInput(input: StaffInput): StaffFieldErrors {
  const errors: StaffFieldErrors = {};

  const name = input.fullName.trim();
  if (!name) {
    errors.fullName = "required";
  } else if (name.length > MAX_NAME_LENGTH) {
    errors.fullName = "tooLong";
  }

  return errors;
}

export function hasFieldErrors(errors: StaffFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
