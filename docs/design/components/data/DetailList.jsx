import React from "react";

// Read-only label → value pairs on a detail surface. A record's contact and
// summary information is not a table (nothing is being compared across records)
// and not a form (nothing is editable), so it had neither component until now.
// A null or empty value renders an em dash — a detail surface never leaves a
// field silently missing.
export function DetailList({ items = [], columns = 1, style }) {
  return (
    <dl style={{
      margin: 0, display: "grid", gap: "12px 20px",
      gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, ...style,
    }}>
      {items.map((it, i) => (
        <div key={it.label || i} style={{ display: "grid", gap: 2, minWidth: 0 }}>
          <dt style={{ fontSize: "var(--text-meta)", fontWeight: 400, color: "var(--muted)" }}>{it.label}</dt>
          <dd style={{
            margin: 0, fontSize: "var(--text-body)", lineHeight: "var(--leading-body)",
            color: it.value == null || it.value === "" ? "var(--muted)" : "var(--ink)",
            fontVariantNumeric: it.numeric ? "tabular-nums" : undefined,
            overflowWrap: "anywhere",
          }}>{it.value == null || it.value === "" ? "—" : it.value}</dd>
        </div>
      ))}
    </dl>
  );
}
