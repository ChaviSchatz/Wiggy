import React from "react";
import { Icon } from "./Icon.jsx";

// The one search input. Extracted from FilterBar, which still renders it, so a
// surface that needs search without a tab row — a wizard step, a picker — gets
// the identical control instead of rebuilding it.
export function SearchField({ value, onChange, placeholder = "חיפוש…", style, inputProps }) {
  const [focus, setFocus] = React.useState(false);
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8, height: "var(--control-height)", padding: "0 11px",
      flex: "1 1 180px", maxWidth: 260, minWidth: 140, boxSizing: "border-box",
      borderRadius: "var(--radius-xs)", background: "var(--surface)",
      border: `1px solid ${focus ? "var(--mauve-600)" : "var(--line)"}`,
      boxShadow: focus ? "0 0 0 3px var(--mauve-100)" : "none",
      transition: "border-color 150ms cubic-bezier(0,0,.2,1)", ...style,
    }}>
      <Icon name="search" size={15} strokeWidth={1.6} style={{ color: "var(--faint)" }} />
      <input
        value={value || ""}
        placeholder={placeholder}
        onChange={(e) => onChange && onChange(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={{ flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent", fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--ink)" }}
        {...inputProps}
      />
    </div>
  );
}
