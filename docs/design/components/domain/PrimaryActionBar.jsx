import React from "react";

// The action row of a detail/hub page or a wizard footer. One plum action.
export function PrimaryActionBar({ primary, secondary, destructive, sticky, style }) {
  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", background: "var(--surface)",
        border: "1px solid var(--line)", borderRadius: "var(--radius-md)",
        position: sticky ? "sticky" : "static", bottom: sticky ? 0 : undefined,
        zIndex: sticky ? "var(--z-nav)" : undefined, ...style,
      }}
    >
      {primary}
      {secondary}
      {destructive && <div style={{ marginInlineStart: "auto" }}>{destructive}</div>}
    </div>
  );
}
