/**
 * The shared frame for every text-entry and choice control (design-system.md
 * §4): 39px tall, `radius-xs`, a `line-strong` border so it reads as editable,
 * and a `mauve-600` border with a 3px `mauve-100` ring on focus.
 *
 * Kept in one place because Input, Textarea, and Select must be
 * indistinguishable when they sit next to each other in a form row — three
 * copies of this string is how they stop being.
 */
export const CONTROL_FOCUS =
  "focus-visible:border-mauve-600 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-mauve-100";

export const CONTROL_FRAME =
  "w-full rounded-xs border border-line-strong bg-surface text-body text-ink placeholder:text-muted disabled:cursor-not-allowed disabled:opacity-50";

/** Height is separate: `Textarea` grows instead of taking a fixed height. */
export const CONTROL_HEIGHT = "h-[39px]";
