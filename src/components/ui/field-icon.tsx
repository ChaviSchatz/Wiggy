/** Small icon chip placed before a form label. */
export function FieldIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-md bg-fill-subtle text-muted">
      {children}
    </span>
  );
}
