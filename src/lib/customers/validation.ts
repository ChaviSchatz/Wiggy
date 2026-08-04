/**
 * Pure validation for customer create/edit input. Framework-agnostic (no
 * Next.js, no Supabase) so it's directly unit-testable and reusable from any
 * adapter (Server Action today; a future API route tomorrow).
 *
 * Fields are intentionally simple (docs/domains/customers.md): only `name`
 * is required, and there's no uniqueness check — "merge duplicate
 * customers" is `[future]`, which implies duplicates are expected for now.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type CustomerInput = {
  name: string;
  phone: string;
  email: string;
  notes: string;
};

export type CustomerFieldErrors = Partial<
  Record<keyof CustomerInput, "required" | "invalid">
>;

export function validateCustomerInput(
  input: CustomerInput,
): CustomerFieldErrors {
  const errors: CustomerFieldErrors = {};

  if (!input.name.trim()) {
    errors.name = "required";
  }

  if (input.email.trim() && !EMAIL_PATTERN.test(input.email.trim())) {
    errors.email = "invalid";
  }

  return errors;
}

export function hasFieldErrors(errors: CustomerFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
