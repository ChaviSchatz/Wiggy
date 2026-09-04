import { cn } from "@/lib/utils";

/**
 * Wiggy: Rubik, tight, plum — beside a delicate five-strand mark. The mark is
 * drawn from hairlines on purpose; it must never read as an illustration.
 * Documented as a placeholder, not the final brand mark (design-sync NOTES).
 */
function WiggyMark({
  size = 22,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn("flex-none", className)}
    >
      <g stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" opacity="0.95">
        <path d="M12 20.5V9" />
        <path d="M12 12.2C12 9 10.1 6.3 7.2 5.1" />
        <path d="M12 12.2C12 9 13.9 6.3 16.8 5.1" />
        <path d="M12 15.4c0-2.6-1.5-4.8-3.9-5.9" />
        <path d="M12 15.4c0-2.6 1.5-4.8 3.9-5.9" />
      </g>
      <circle cx="12" cy="7.2" r="1.15" fill="currentColor" />
    </svg>
  );
}

export interface WordmarkProps {
  text?: string;
  subtitle?: string;
  /** Switches to sidebar-mark / sidebar-fg-dim for the dark side nav. */
  onDark?: boolean;
  size?: number;
  className?: string;
}

/** The plum wordmark — the one brand element on auth screens and the side nav. */
export function Wordmark({ text = "Wiggy", subtitle, onDark, size = 21, className }: WordmarkProps) {
  return (
    <div className={cn("grid gap-0.5", className)}>
      <span className="flex items-center gap-1.5">
        <span
          className={cn(
            "font-display font-bold leading-tight tracking-tight",
            onDark ? "text-white" : "text-mauve-600",
          )}
          style={{ fontSize: size }}
        >
          {text}
        </span>
        <WiggyMark
          size={size * 0.95}
          className={cn(onDark ? "text-sidebar-mark opacity-90" : "text-mauve-600")}
        />
      </span>
      {subtitle && (
        <span className={cn("text-meta", onDark ? "text-sidebar-fg-dim" : "text-muted")}>
          {subtitle}
        </span>
      )}
    </div>
  );
}
