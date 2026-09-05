import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Wraps an LTR run (a formatted date, a number range) in Unicode directional
 * isolates so the bidi algorithm can't reorder it relative to surrounding
 * RTL text -- without this, "{start} – {end}" interpolated into an RTL
 * string like sprintChip renders with the two dates visually swapped.
 */
export function ltrIsolate(text: string): string {
  return `⁦${text}⁩`;
}
