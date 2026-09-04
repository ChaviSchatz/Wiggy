import React from "react";
import { Wordmark } from "./Wordmark.jsx";
import { Avatar } from "../core/Avatar.jsx";
import { Icon } from "../core/Icon.jsx";

// White, 60px, hairline bottom border, spans the MAIN COLUMN only. Quiet by
// design: transient tools here, page actions in the PageHeader.
export function TopBar({ actions, user, onUser, showWordmark, style }) {
  const [hover, setHover] = React.useState(false);
  return (
    <header
      style={{
        height: "var(--topbar-height)", flex: "none", background: "var(--surface)",
        borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center",
        gap: 8, padding: "0 var(--gutter-desktop)", zIndex: "var(--z-header)", ...style,
      }}
    >
      {showWordmark && <Wordmark size={16} />}
      <div style={{ marginInlineStart: "auto", display: "flex", alignItems: "center", gap: 4 }}>{actions}</div>
      {user && (
        <button
          type="button"
          onClick={onUser}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          style={{
            display: "flex", alignItems: "center", gap: 8, marginInlineStart: 8, padding: "3px 8px 3px 5px",
            border: "1px solid " + (hover ? "var(--line)" : "transparent"), borderRadius: 8,
            background: hover ? "var(--surface-soft)" : "transparent", cursor: onUser ? "pointer" : "default",
            fontFamily: "var(--font-sans)", textAlign: "start",
            transition: "background-color 150ms cubic-bezier(0,0,.2,1), border-color 150ms cubic-bezier(0,0,.2,1)",
          }}
        >
          <Avatar name={user.name} src={user.src} size="xs" />
          <span style={{ display: "grid", gap: 0, minWidth: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: "var(--ink)", whiteSpace: "nowrap" }}>{user.name}</span>
            {user.role && <span style={{ fontSize: 10.5, color: "var(--muted)", whiteSpace: "nowrap" }}>{user.role}</span>}
          </span>
          <Icon name="chevron-down" size={13} strokeWidth={1.6} style={{ color: "var(--faint)" }} />
        </button>
      )}
    </header>
  );
}
