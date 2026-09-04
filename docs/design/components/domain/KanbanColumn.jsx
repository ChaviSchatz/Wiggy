import React from "react";

// Board column. Width is not the column's business: the board is a fluid grid
// and every column takes an equal share, compressing instead of scrolling the
// board sideways. A barely-visible stage tint lets the eye hold a column
// without the board turning into a colour chart.
export function KanbanColumn({ title, subtitle, count, countLabel, tint = "warm", emptyLabel = "אין משימות בשלב זה", footer, children, style }) {
  const empty = React.Children.toArray(children).length === 0;
  return (
    <section
      style={{
        minWidth: 0, flex: "1 1 0", background: `var(--stage-${tint}, var(--stage-warm))`,
        border: "1px solid var(--line)", borderRadius: "var(--radius-sm)",
        display: "flex", flexDirection: "column", maxHeight: "100%", ...style,
      }}
    >
      <header style={{ padding: "9px 9px 8px", display: "grid", gap: 5 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, minWidth: 0 }}>
          <span style={{
            fontFamily: "var(--font-display)", fontSize: 12.5, fontWeight: 600, letterSpacing: "-0.01em",
            color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0,
          }}>{title}</span>
          {count != null && (
            <span style={{ marginInlineStart: "auto", fontSize: 10.5, fontWeight: 400, color: "var(--faint)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", flex: "none" }}>
              {countLabel ? count + " " + countLabel : count}
            </span>
          )}
        </div>
        <span style={{ width: 22, height: 1.5, borderRadius: 2, background: "var(--mauve-600)", opacity: 0.35 }} />
        {subtitle && <div style={{ fontSize: "var(--text-micro)", color: "var(--muted)" }}>{subtitle}</div>}
      </header>
      <div style={{ display: "grid", gap: 6, padding: "0 7px 8px", overflow: "auto", alignContent: "start", flex: 1 }}>
        {empty
          ? <p style={{ margin: 0, padding: "4px 3px 10px", fontSize: 10.5, color: "var(--faint)" }}>{emptyLabel}</p>
          : children}
      </div>
      {footer && <div style={{ padding: "0 7px 8px" }}>{footer}</div>}
    </section>
  );
}
