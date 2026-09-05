"use client";

import { cn } from "@/lib/utils";

/**
 * A boolean filter that reads as its own tone rather than a generic control
 * (design-system.md §4) -- used for "urgent only" / "due soon" style toggles
 * across orders and the board.
 */
export function FilterToggle({
  active,
  onClick,
  icon,
  label,
  tone,
  className,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  tone: "danger" | "warning";
  className?: string;
}) {
  const toneClass =
    tone === "danger"
      ? "border-danger-200 bg-danger-100 text-danger-600"
      : "border-peach-200 bg-peach-100 text-peach-600";

  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex h-[39px] items-center gap-1.5 rounded-xs border px-3 text-body font-medium transition-colors",
        active
          ? toneClass
          : "border-line-strong bg-surface text-muted hover:bg-mauve-100/50",
        className,
      )}
    >
      {icon}
      {label}
    </button>
  );
}
