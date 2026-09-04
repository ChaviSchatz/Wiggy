import { cn } from "@/lib/utils";

// Cycled by column position, never `work_stages.color` -- a tenant-entered
// hex carries no contrast guarantee and would sit outside the controlled
// palette. This is a small, curated set the system owns instead.
const TINT_CLASSES = [
  "bg-stage-1",
  "bg-stage-2",
  "bg-stage-3",
  "bg-stage-4",
  "bg-stage-5",
] as const;

/**
 * A board column (design-system.md §4). Shared by the production board and
 * sprint planning so the two cannot drift apart.
 *
 * Each column gets a faint, position-cycled tint so columns read as visually
 * distinct at a glance -- on top of that, stage identity still comes from
 * the header text and the hairline tick, not from the tint alone.
 */
export function KanbanColumn({
  title,
  subtitle,
  count,
  emptyLabel,
  index = 0,
  children,
}: {
  title: string;
  subtitle?: string;
  count: number;
  /** Shown instead of the body when the column has nothing in it. */
  emptyLabel?: string;
  /** Column position, for the tint cycle. */
  index?: number;
  children: React.ReactNode;
}) {
  const tint = TINT_CLASSES[index % TINT_CLASSES.length];

  return (
    <section
      className={cn(
        "flex w-[280px] shrink-0 flex-col rounded-sm border border-line",
        tint,
      )}
    >
      <header className="flex items-center justify-between gap-2 border-b border-line px-3 py-2.5">
        <span className="flex min-w-0 items-center gap-2">
          <span
            className="h-4 w-0.5 shrink-0 rounded-full bg-hairline"
            aria-hidden
          />
          <span className="min-w-0">
            <span className="block truncate text-label text-ink">{title}</span>
            {subtitle ? (
              <span className="block truncate text-meta text-muted">
                {subtitle}
              </span>
            ) : null}
          </span>
        </span>
        <span className="shrink-0 rounded-full bg-mauve-100 px-2 py-0.5 text-meta font-medium tabular-nums text-mauve-600">
          {count}
        </span>
      </header>

      {count === 0 && emptyLabel ? (
        <p className="px-3 py-6 text-center text-meta text-muted">
          {emptyLabel}
        </p>
      ) : (
        <div className="flex flex-col gap-2 p-2">{children}</div>
      )}
    </section>
  );
}
