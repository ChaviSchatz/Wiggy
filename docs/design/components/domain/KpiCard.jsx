import React from "react";

// text-metric value in display, label at text-label, caption at text-meta.
// At most one emphasised card per view.
export function KpiCard({ label, value, caption, eyebrow, emphasis, onClick, style }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: "var(--surface)", borderRadius: "var(--radius-sm)",
        border: emphasis ? "2px solid rgb(103 43 98 / 0.34)" : "1px solid var(--line)",
        padding: emphasis ? 15 : 16, display: "grid", gap: 4, cursor: onClick ? "pointer" : "default", ...style,
      }}
    >
      {eyebrow && (
        <span style={{
          justifySelf: "start", background: "var(--mauve-100)", color: "var(--mauve-600)",
          borderRadius: "var(--radius-full)", padding: "2px 9px", fontSize: "var(--text-meta)", fontWeight: 600,
        }}>{eyebrow}</span>
      )}
      <span style={{ fontSize: "var(--text-label)", fontWeight: 600, color: "var(--muted)" }}>{label}</span>
      <span style={{
        fontFamily: "var(--font-display)", fontSize: "var(--text-metric)", fontWeight: 800,
        letterSpacing: "-0.02em", lineHeight: "var(--leading-metric)", fontVariantNumeric: "tabular-nums", color: "var(--ink)",
      }}>{value}</span>
      {caption && <span style={{ fontSize: "var(--text-meta)", color: "var(--muted)" }}>{caption}</span>}
    </div>
  );
}
