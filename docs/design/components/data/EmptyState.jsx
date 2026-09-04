import React from "react";
import { Icon } from "../core/Icon.jsx";

// An EmptyState always offers one clear next action.
export function EmptyState({ icon = "inbox", title, description, action, style }) {
  return (
    <div style={{
      display: "grid", justifyItems: "center", gap: 8, textAlign: "center", padding: "40px 24px",
      background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius-md)", ...style,
    }}>
      <span style={{
        width: 44, height: 44, borderRadius: "var(--radius-full)", background: "var(--mauve-100)",
        color: "var(--mauve-600)", display: "inline-flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon name={icon} size={20} />
      </span>
      <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-section)", fontWeight: 700 }}>{title}</div>
      {description && <p style={{ margin: 0, fontSize: "var(--text-body)", color: "var(--muted)", maxWidth: 380, textWrap: "pretty" }}>{description}</p>}
      {action && <div style={{ marginTop: 6 }}>{action}</div>}
    </div>
  );
}
