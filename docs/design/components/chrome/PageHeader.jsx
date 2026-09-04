import React from "react";

// Every page title goes through this. There is no second way. The title is
// present but not loud, and the work below it starts close.
export function PageHeader({ title, titleMeta, subtitle, actions, backLink, size = "default", style }) {
  const compact = size === "compact";
  return (
    <div style={{ display: "grid", gap: compact ? 2 : 4, marginBottom: compact ? 12 : 16, ...style }}>
      {backLink}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 16, flexWrap: "wrap" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap", minWidth: 0 }}>
            <h1 style={{
              margin: 0, fontFamily: "var(--font-display)",
              fontSize: compact ? "var(--text-metric)" : "var(--text-page)",
              fontWeight: compact ? 600 : "var(--text-page-weight)",
              letterSpacing: compact ? "-0.02em" : "var(--text-page-tracking)",
              lineHeight: compact ? 1.1 : 1.15, color: "var(--ink)", textWrap: "balance",
            }}>{title}</h1>
            {titleMeta && <span style={{ fontSize: "var(--text-page-sub)", fontWeight: 400, color: "var(--muted)", whiteSpace: "nowrap" }}>{titleMeta}</span>}
          </div>
          {subtitle && <p style={{ margin: compact ? "2px 0 0" : "4px 0 0", fontSize: "var(--text-page-sub)", fontWeight: 400, color: "var(--muted)" }}>{subtitle}</p>}
        </div>
        {actions && <div style={{ marginInlineStart: "auto", display: "flex", gap: 8, alignItems: "center" }}>{actions}</div>}
      </div>
    </div>
  );
}
