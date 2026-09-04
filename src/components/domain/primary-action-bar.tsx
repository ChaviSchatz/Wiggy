import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * The action row for a detail page or hub footer (design-system.md
 * "domain" group, Archetype B): the single plum `primary` action, quiet
 * `secondary` actions, and `destructive` (danger-soft, never solid) pushed
 * to the inline end.
 *
 * `sticky` pins the bar to the bottom of the viewport below `lg` -- on a
 * short mobile/tablet viewport the actions stay reachable without scrolling
 * past a long hub page; at `lg` and up there's room for it to sit inline.
 */
export function PrimaryActionBar({
  primary,
  secondary,
  destructive,
  sticky = false,
  className,
}: {
  primary?: ReactNode;
  secondary?: ReactNode;
  /** Pushed to the inline end -- danger-soft trigger, never solid. */
  destructive?: ReactNode;
  sticky?: boolean;
  className?: string;
}) {
  if (!primary && !secondary && !destructive) return null;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 border-t border-line bg-surface-soft px-4 py-3",
        // Below `lg`, `BottomNav` is a fixed 65px bar (+ safe-area inset) at
        // the true viewport bottom -- stick just above it, not behind it.
        sticky &&
          "sticky bottom-[calc(65px+env(safe-area-inset-bottom))] z-10 lg:static lg:bottom-auto lg:border-0 lg:bg-transparent lg:px-0 lg:py-0",
        className,
      )}
    >
      {secondary}
      {primary}
      {destructive ? <div className="ms-auto">{destructive}</div> : null}
    </div>
  );
}
