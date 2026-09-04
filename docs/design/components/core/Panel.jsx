import React from "react";

export function Panel({ title, subtitle, actions, tick = true, children, bodyStyle, style, ...rest }) {
  return (
    <section
      style={{
        background: "var(--surface)", border: "1px solid var(--line)",
        borderRadius: "var(--radius-md)", overflow: "hidden", ...style,
      }}
      {...rest}
    >
      {(title || actions) && (
        <header style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: "1px solid var(--line)" }}>
          {tick && <span style={{ width: 2, height: 18, borderRadius: 2, background: "var(--hairline)", flex: "none" }} />}
          <div style={{ minWidth: 0 }}>
            {title && <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "var(--text-section)", fontWeight: 700, lineHeight: "var(--leading-section)", color: "var(--ink)" }}>{title}</h2>}
            {subtitle && <p style={{ margin: 0, fontSize: "var(--text-meta)", color: "var(--muted)" }}>{subtitle}</p>}
          </div>
          {actions && <div style={{ marginInlineStart: "auto", display: "flex", gap: 8 }}>{actions}</div>}
        </header>
      )}
      <div style={{ padding: 16, ...bodyStyle }}>{children}</div>
    </section>
  );
}
