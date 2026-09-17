/**
 * Pure validation for the appointment-type create/edit form, mirroring
 * `src/lib/customers/validation.ts` / `src/lib/people/validation.ts`.
 */

const MAX_NAME_LENGTH = 120;

export type AppointmentTypeInput = {
  name: string;
  /** Raw form string; "" means no default duration. */
  defaultDurationMinutes: string;
};

export type AppointmentTypeFieldErrors = Partial<
  Record<"name" | "defaultDurationMinutes", "required" | "tooLong" | "invalid">
>;

export function validateAppointmentTypeInput(
  input: AppointmentTypeInput,
): AppointmentTypeFieldErrors {
  const errors: AppointmentTypeFieldErrors = {};

  const name = input.name.trim();
  if (!name) {
    errors.name = "required";
  } else if (name.length > MAX_NAME_LENGTH) {
    errors.name = "tooLong";
  }

  const duration = input.defaultDurationMinutes.trim();
  if (duration) {
    const parsed = Number(duration);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      errors.defaultDurationMinutes = "invalid";
    }
  }

  return errors;
}

export function hasAppointmentTypeErrors(
  errors: AppointmentTypeFieldErrors,
): boolean {
  return Object.keys(errors).length > 0;
}
