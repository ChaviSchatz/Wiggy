import React from "react";
import { Wordmark } from "./Wordmark.jsx";
import { Avatar } from "../core/Avatar.jsx";
import { Icon } from "../core/Icon.jsx";

// Deep plum, 196px, role-filtered, >=lg only. It is a margin, not a feature:
// narrow, quiet type, and an active state made of a thin plum-light marker and
// full-strength text rather than a filled pill.
export function SideNav({ items = [], activeId, onSelect, user, brandSubtitle, helpLabel = "עזרה", onHelp, style }) {
  const [hover, setHover] = React.useState(null);
  return (
    <nav
      style={{
        width: "var(--sidenav-width)", flex: "none", background: "var(--sidebar)",
        display: "flex", flexDirection: "column", zIndex: "var(--z-nav)", ...style,
      }}
    >
      <div style={{ padding: "16px 12px 12px" }}>
        <Wordmark subtitle={brandSubtitle} onDark size={18} />
      </div>
      <ul style={{ listStyle: "none", margin: 0, padding: "4px 8px 0", display: "grid", gap: 2, alignContent: "start", flex: 1 }}>
        {items.map((it) => {
          const active = it.id === activeId;
          return (
            <li key={it.id} style={{ position: "relative" }}>
              {active && (
                <span aria-hidden="true" style={{
                  position: "absolute", insetInlineStart: 0, top: "50%", transform: "translateY(-50%)",
                  width: 2, height: 15, borderRadius: 2, background: "var(--sidebar-mark)",
                }} />
              )}
              <button
                type="button"
                onClick={() => onSelect && onSelect(it.id)}
                onMouseEnter={() => setHover(it.id)}
                onMouseLeave={() => setHover(null)}
                style={{
                  width: "100%", height: "var(--sidenav-item-height)", display: "flex", alignItems: "center", gap: 10,
                  padding: "0 10px", border: "none", cursor: "pointer", textAlign: "start",
                  borderRadius: 8, fontFamily: "var(--font-sans)", fontSize: 12.5,
                  fontWeight: 400, letterSpacing: "0.005em",
                  color: active ? "#fff" : "var(--sidebar-fg-dim)",
                  background: active ? "var(--sidebar-active)" : hover === it.id ? "var(--sidebar-hover)" : "transparent",
                  transition: "background-color 150ms cubic-bezier(0,0,.2,1), color 150ms cubic-bezier(0,0,.2,1)",
                }}
              >
                {it.icon && <Icon name={it.icon} size={18} strokeWidth={1.5} style={{ opacity: active ? 0.95 : 0.62, flex: "none" }} />}
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.label}</span>
                {it.count != null && (
                  <span style={{ fontSize: 10.5, fontVariantNumeric: "tabular-nums", fontWeight: 400, color: active ? "rgb(255 255 255 / 0.7)" : "rgb(255 255 255 / 0.42)" }}>{it.count}</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      <div style={{ padding: "8px 8px 12px", display: "grid", gap: 4 }}>
        <button
          type="button"
          onClick={onHelp}
          style={{
            display: "flex", alignItems: "center", gap: 10, height: 32, padding: "0 10px", border: "none",
            background: "transparent", cursor: "pointer", borderRadius: 8, textAlign: "start",
            fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--sidebar-fg-dim)",
          }}
        >
          <Icon name="help-circle" size={18} strokeWidth={1.5} style={{ opacity: 0.62 }} />
          <span>{helpLabel}</span>
        </button>
        {user && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 9px 2px", borderTop: "1px solid var(--sidebar-line)" }}>
            <Avatar name={user.name} src={user.src} size="xs" onDark />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, color: "rgb(255 255 255 / 0.92)", fontWeight: 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</div>
              {user.role && <div style={{ fontSize: 10.5, color: "var(--sidebar-fg-dim)" }}>{user.role}</div>}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
