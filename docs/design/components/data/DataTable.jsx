import React from "react";

// Flat and dense: surface-soft header, 1px line separators, no per-row card,
// no vertical rules, text-start throughout.
export function DataTable({ columns = [], rows = [], onRowClick, rowKey = (r, i) => i, style }) {
  const [hover, setHover] = React.useState(null);
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius-sm)", overflow: "hidden", ...style }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-sans)", fontSize: "var(--text-body)" }}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} style={{
                textAlign: "start", padding: "10px 14px", background: "var(--surface-soft)",
                borderBottom: "1px solid var(--line)", fontSize: "var(--text-label)", fontWeight: 600,
                color: "var(--muted)", whiteSpace: "nowrap", width: c.width,
              }}>{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const k = rowKey(r, i);
            return (
              <tr
                key={k}
                onClick={onRowClick ? () => onRowClick(r) : undefined}
                onMouseEnter={() => setHover(k)}
                onMouseLeave={() => setHover(null)}
                style={{
                  background: hover === k ? "var(--mauve-100)" : "transparent",
                  cursor: onRowClick ? "pointer" : "default",
                  transition: "background-color 150ms cubic-bezier(0,0,.2,1)",
                }}
              >
                {columns.map((c) => (
                  <td key={c.key} style={{
                    padding: "11px 14px", borderBottom: "1px solid var(--line)", color: "var(--ink)",
                    fontVariantNumeric: c.numeric ? "tabular-nums" : undefined,
                    whiteSpace: c.numeric ? "nowrap" : undefined, verticalAlign: "middle",
                  }}>{c.render ? c.render(r) : r[c.key]}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
