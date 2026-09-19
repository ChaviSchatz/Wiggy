import { isRole } from "@/lib/roles";

/**
 * Pure validation for the People create/edit form (ADR 0013).
 * Framework-agnostic, mirroring `src/lib/customers/validation.ts`.
 *
 * Only `fullName` is required. A person may be roster-only -- no login at all
 * -- which is why `email`/`role` are optional but must arrive together.
 */

const MAX_NAME_LENGTH = 120;

export type PersonInput = {
  fullName: string;
  title: string;
  defaultWorkStageId: string;
  isAssignable: boolean;
  isBookable: boolean;
  /** Empty means roster-only: no login is being granted. */
  email: string;
  role: string;
};

export type PersonFieldErrors = Partial<
  Record<"fullName" | "email" | "role", "required" | "tooLong" | "invalid">
>;

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePersonInput(input: PersonInput): PersonFieldErrors {
  const errors: PersonFieldErrors = {};

  const name = input.fullName.trim();
  if (!name) {
    errors.fullName = "required";
  } else if (name.length > MAX_NAME_LENGTH) {
    errors.fullName = "tooLong";
  }

  const email = input.email.trim();
  const role = input.role.trim();

  if (email && !isValidEmail(email)) errors.email = "invalid";
  if (role && !isRole(role)) errors.role = "invalid";

  // A membership needs both halves or neither: the row cannot exist without
  // a role, and a role is meaningless with nobody to attach it to.
  if (email && !role) errors.role = errors.role ?? "required";
  if (role && !email) errors.email = errors.email ?? "required";

  return errors;
}

export function hasFieldErrors(errors: PersonFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
