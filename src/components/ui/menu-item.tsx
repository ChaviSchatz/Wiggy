import * as React from "react";

import { cn } from "@/lib/utils";

export type MenuTone = "default" | "danger";

/**
 * One row inside a Popover-based action menu -- the top bar's user menu and a
 * table row's overflow menu are the same object, so they share one look.
 * Exported as a class too, for menu rows that must be a `Link` or a submit
 * button inside a form.
 */
export function menuItemClass(tone: MenuTone = "default") {
  return cn(
    "flex w-full items-center gap-2 rounded-control px-2 py-2 text-start text-body transition-colors disabled:pointer-events-none disabled:opacity-50",
    tone === "danger"
      ? "text-danger-600 hover:bg-danger-100"
      : "text-ink hover:bg-mauve-100",
  );
}

export const MenuItem = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: MenuTone }
>(({ tone, className, children, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    className={cn(menuItemClass(tone), className)}
    {...props}
  >
    {children}
  </button>
));
MenuItem.displayName = "MenuItem";
