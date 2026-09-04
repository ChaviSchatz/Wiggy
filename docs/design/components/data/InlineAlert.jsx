import React from "react";
import { Icon } from "../core/Icon.jsx";

const ICON = { danger: "alert-circle", peach: "alert-triangle", sage: "check-circle", info: "info", mauve: "info" };

// A message about the surface as a whole: a submission that failed, a section
// left incomplete, a result confirmed. FormMessage speaks for one field and
// UndoToast is transient; neither can carry a blocking page-level statement.
// Tinted -100 ground, -200 border, -600 text: the StatusChip triplet at panel
// scale. Calm, not an alarm — no filled danger banner, no icon in a coloured
// circle, no dismiss chrome unless the caller asks for it.
export function InlineAlert({ tone = "danger", title, children, action, icon, style }) {
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      style={{
        display: "flex", alignItems: "flex-start", gap: 10, padding: "11px 13px",
        borderRadius: "var(--radius-xs)", background: `var(--${tone}-100)`,
        border: `1px solid var(--${tone}-200)`, fontFamily: "var(--font-sans)", ...style,
      }}
    >
      <Icon name={icon || ICON[tone] || "info"} size={16} strokeWidth={1.7} style={{ color: `var(--${tone}-600)`, flex: "none", marginTop: 1 }} />
      <div style={{ display: "grid", gap: 3, minWidth: 0, flex: 1 }}>
        {title && <span style={{ fontSize: "var(--text-label)", fontWeight: 600, color: `var(--${tone}-600)` }}>{title}</span>}
        {children && <div style={{ fontSize: "var(--text-meta)", color: "var(--ink)", textWrap: "pretty" }}>{children}</div>}
      </div>
      {action && <div style={{ flex: "none" }}>{action}</div>}
    </div>
  );
}
