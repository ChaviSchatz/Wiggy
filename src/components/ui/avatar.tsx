import { cn } from "@/lib/utils";

const MONOGRAM_COLORS = [
  "bg-mauve-100 text-mauve-600",
  "bg-sage-100 text-sage-600",
  "bg-peach-100 text-danger-600",
];

function colorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return MONOGRAM_COLORS[hash % MONOGRAM_COLORS.length];
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2);
  return `${parts[0][0]}${parts[parts.length - 1][0]}`;
}

/**
 * Circular worker avatar (design-language.md "Identity & media rules"):
 * workers always render an avatar, monogram fallback with a stable colour.
 * Never used for client identity, which is text-only.
 */
export function Avatar({
  name,
  size = "md",
  className,
}: {
  /** `null` renders the unassigned state (dashed ring, no monogram). */
  name: string | null;
  size?: "sm" | "md";
  className?: string;
}) {
  const dimension = size === "sm" ? "size-7 text-xs" : "size-9 text-sm";

  if (!name) {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-full border-2 border-dashed border-line text-muted",
          dimension,
          className,
        )}
        aria-hidden
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-medium",
        colorForName(name),
        dimension,
        className,
      )}
      title={name}
    >
      {initials(name)}
    </span>
  );
}
