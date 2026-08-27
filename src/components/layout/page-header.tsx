/**
 * The only way to render a page title (design-system.md §4). The `actions` slot
 * exists so screens with header-level controls compose them here instead of
 * hand-rolling their own `<h1>`.
 */
export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="space-y-1">
        <h1 className="font-display text-page text-ink">{title}</h1>
        {subtitle ? <p className="text-body text-muted">{subtitle}</p> : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
