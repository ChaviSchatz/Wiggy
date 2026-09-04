import React from "react";
import { Icon } from "../core/Icon.jsx";

// One shared search + filter row for every list and board. Tabs are editorial:
// muted text, no ground, and a fine plum underline on the active one. Never pills.
export function FilterBar({ tabs = [], activeTab, onTabChange, search, onSearchChange, searchPlaceholder = "חיפוש…", actions, style }) {
  const [focus, setFocus] = React.useState(false);
  const [hover, setHover] = React.useState(null);
  return (
    <div style={{ display: "grid", gap: 12, marginBottom: 16, ...style }}>
      <div style={{ display: "flex", gap: 0, alignItems: "stretch", borderBottom: "1px solid var(--line)", minWidth: 0, overflowX: "auto" }}>
        {tabs.map((t) => {
          const active = t.id === activeTab;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onTabChange && onTabChange(t.id)}
              onMouseEnter={() => setHover(t.id)}
              onMouseLeave={() => setHover(null)}
              style={{
                border: "none", background: "transparent", cursor: "pointer", padding: "0 10px 8px",
                marginBottom: -1, fontFamily: "var(--font-sans)", fontSize: 12.5,
                fontWeight: active ? 600 : 400,
                color: active ? "var(--mauve-600)" : hover === t.id ? "var(--ink)" : "var(--muted)",
                borderBottom: `2px solid ${active ? "var(--mauve-600)" : "transparent"}`, whiteSpace: "nowrap",
                display: "inline-flex", alignItems: "baseline", gap: 4,
                transition: "color 150ms cubic-bezier(0,0,.2,1)",
              }}
            >
              {t.label}
              {t.count != null && (
                <span style={{ fontSize: 10.5, fontVariantNumeric: "tabular-nums", fontWeight: 400, color: active ? "var(--mauve-600)" : "var(--faint)", opacity: active ? 0.7 : 1 }}>{t.count}</span>
              )}
            </button>
          );
        })}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        {onSearchChange && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8, height: "var(--control-height)", padding: "0 11px",
            flex: "1 1 180px", maxWidth: 260, minWidth: 140,
            borderRadius: "var(--radius-xs)", background: "var(--surface)",
            border: `1px solid ${focus ? "var(--mauve-600)" : "var(--line)"}`,
            boxShadow: focus ? "0 0 0 3px var(--mauve-100)" : "none",
            transition: "border-color 150ms cubic-bezier(0,0,.2,1)",
          }}>
            <Icon name="search" size={15} strokeWidth={1.6} style={{ color: "var(--faint)" }} />
            <input
              value={search || ""}
              placeholder={searchPlaceholder}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => setFocus(true)}
              onBlur={() => setFocus(false)}
              style={{ flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent", fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--ink)" }}
            />
          </div>
        )}
        {actions}
      </div>
    </div>
  );
}
