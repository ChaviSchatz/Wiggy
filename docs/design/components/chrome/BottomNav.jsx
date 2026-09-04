import React from "react";
import { Icon } from "../core/Icon.jsx";

// <lg only. Role-filtered, >=44px targets, respects safe-area inset.
export function BottomNav({ items = [], activeId, onSelect, style }) {
  return (
    <nav
      style={{
        height: "var(--bottomnav-height)", paddingBottom: "env(safe-area-inset-bottom)",
        background: "var(--surface)", borderTop: "1px solid var(--line)",
        display: "flex", alignItems: "stretch", zIndex: "var(--z-bottom)", ...style,
      }}
    >
      {items.map((it) => {
        const active = it.id === activeId;
        return (
          <button
            key={it.id}
            type="button"
            onClick={() => onSelect && onSelect(it.id)}
            style={{
              flex: 1, minHeight: "var(--touch-target-min)", border: "none", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
              background: active ? "var(--mauve-100)" : "transparent",
              color: active ? "var(--mauve-600)" : "var(--muted)",
              fontFamily: "var(--font-sans)", fontSize: "var(--text-meta)", fontWeight: active ? 600 : 400,
            }}
          >
            {it.icon && <Icon name={it.icon} size={20} />}
            {it.label}
          </button>
        );
      })}
    </nav>
  );
}
