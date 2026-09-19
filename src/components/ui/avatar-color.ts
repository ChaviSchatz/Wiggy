/**
 * Monogram colour assignment, split out of `avatar.tsx` on purpose: `Avatar`
 * is a client component (it tracks image-load failure), and functions exported
 * from a `"use client"` module cannot be called from server components. The
 * calendar page's legend needs the same hash on the server, so this file must
 * not carry a `"use client"` directive.
 */

/**
 * Calm, stable monogram grounds. Deliberately excludes `danger`, so a worker's
 * initials can never be mistaken for an alert.
 */
export const MONOGRAM_COLORS = [
  "bg-mauve-100 text-mauve-600",
  "bg-sage-100 text-sage-600",
  "bg-info-100 text-info-600",
  "bg-peach-100 text-peach-600",
];

export function colorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return MONOGRAM_COLORS[hash % MONOGRAM_COLORS.length];
}
