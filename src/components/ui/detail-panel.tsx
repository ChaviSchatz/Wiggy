import { X } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Inline detail panel: part of the page flow (no overlay), 420px beside the
 * content on `lg`+, stacked under it on narrower screens. Shared by the People
 * and Customers screens so both edit surfaces look identical.
 */
export function DetailPanel({
  leading,
  title,
  subtitle,
  closeLabel,
  onClose,
  className,
  children,
}: {
  /** Avatar or icon circle shown before the title. */
  leading?: React.ReactNode;
  title: string;
  subtitle?: string;
  closeLabel: string;
  onClose: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <aside
      aria-label={title}
      className={cn(
        "flex w-full shrink-0 flex-col overflow-hidden rounded-card border border-line bg-surface shadow-card lg:w-[420px]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
        <div className="flex items-center gap-3 min-w-0">
          {leading}
          <div className="min-w-0">
            <p className="font-semibold text-ink leading-snug">{title}</p>
            {subtitle ? (
              <p className="text-meta text-muted mt-0.5 truncate">{subtitle}</p>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-1 shrink-0 rounded-control p-1 text-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={closeLabel}
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
      {children}
    </aside>
  );
}
