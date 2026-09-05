import { cn } from "@/lib/utils";

// Cycled by column position, never `work_stages.color` -- a tenant-entered
// hex carries no contrast guarantee and would sit outside the controlled
// palette. This is a small, curated set the system owns instead.
export const STAGE_TINT_CLASSES = [
  "bg-stage-1",
  "bg-stage-2",
  "bg-stage-3",
  "bg-stage-4",
  "bg-stage-5",
] as const;

/**
 * Same stage-identity cycle as `STAGE_TINT_CLASSES`, in a solid colour a
 * small dot can actually show (the tints are deliberately near-invisible
 * backgrounds). Anywhere else in the product that needs to say "this is the
 * same stage as that board column" -- the work-type and stage filters --
 * indexes into this array instead of inventing its own palette.
 */
export const STAGE_DOT_CLASSES = [
  "bg-peach-600",
  "bg-sage-600",
  "bg-mauve-600",
  "bg-info-600",
  "bg-idle-600",
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
  const tint = STAGE_TINT_CLASSES[index % STAGE_TINT_CLASSES.length];

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
