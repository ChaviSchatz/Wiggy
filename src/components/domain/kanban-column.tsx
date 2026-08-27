/**
 * A board column (design-system.md §4). Shared by the production board and
 * sprint planning so the two cannot drift apart.
 *
 * Deliberately untinted. `work_stages.color` exists, but a tenant-entered hex
 * carries no contrast guarantee and would sit outside the controlled palette,
 * so stage identity comes from the header text and the hairline tick rather
 * than from a column-wide wash.
 */
export function KanbanColumn({
  title,
  subtitle,
  count,
  emptyLabel,
  children,
}: {
  title: string;
  subtitle?: string;
  count: number;
  /** Shown instead of the body when the column has nothing in it. */
  emptyLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex w-[280px] shrink-0 flex-col rounded-sm border border-line bg-surface-soft">
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
