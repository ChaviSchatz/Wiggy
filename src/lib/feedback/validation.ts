/**
 * Pure validation for the in-app feedback box (screen inventory #58,
 * docs/domains/cross-cutting.md). Framework-agnostic so it's unit-testable
 * without a database.
 */

export const FEEDBACK_KINDS = ["bug", "feature", "question"] as const;
export type FeedbackKind = (typeof FEEDBACK_KINDS)[number];

/** Long enough for a real report, short enough to keep the column sane. */
export const FEEDBACK_MESSAGE_MAX_LENGTH = 2000;

export function isFeedbackKind(value: string): value is FeedbackKind {
  return (FEEDBACK_KINDS as readonly string[]).includes(value);
}

export type FeedbackInput = {
  kind: string;
  message: string;
};

export type FeedbackFieldErrors = Partial<
  Record<keyof FeedbackInput, "required" | "invalid" | "tooLong">
>;

export function validateFeedbackInput(
  input: FeedbackInput,
): FeedbackFieldErrors {
  const errors: FeedbackFieldErrors = {};

  const kind = input.kind.trim();
  if (!kind) {
    errors.kind = "required";
  } else if (!isFeedbackKind(kind)) {
    errors.kind = "invalid";
  }

  const message = input.message.trim();
  if (!message) {
    errors.message = "required";
  } else if (message.length > FEEDBACK_MESSAGE_MAX_LENGTH) {
    errors.message = "tooLong";
  }

  return errors;
}

export function hasFieldErrors(errors: FeedbackFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
