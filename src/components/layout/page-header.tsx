export function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-6 space-y-1">
      <h1 className="text-2xl font-bold text-ink">{title}</h1>
      {subtitle ? <p className="text-sm text-muted">{subtitle}</p> : null}
    </div>
  );
}
