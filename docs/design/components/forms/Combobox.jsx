import React from "react";
import { Icon } from "../core/Icon.jsx";

const base = {
  height: "var(--control-height)", width: "100%", boxSizing: "border-box", padding: "0 12px",
  borderRadius: "var(--radius-xs)", border: "1px solid var(--line-strong)", background: "var(--surface)",
  color: "var(--ink)", fontFamily: "var(--font-sans)", fontSize: "var(--text-body)", outline: "none",
  transition: "border-color 150ms cubic-bezier(0,0,.2,1), box-shadow 150ms cubic-bezier(0,0,.2,1)",
};
const focusRing = { borderColor: "var(--mauve-600)", boxShadow: "0 0 0 3px var(--mauve-100)" };
const invalidRing = { borderColor: "var(--danger-500)" };

// Select with type-ahead filtering — customer pickers, long catalogs.
export function Combobox({ options = [], value, onChange, placeholder = "חיפוש…", emptyLabel = "אין תוצאות", style }) {
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [focus, setFocus] = React.useState(false);
  const current = options.find((o) => o.value === value);
  const list = options.filter((o) => o.label.includes(query));
  return (
    <div style={{ position: "relative", ...style }}>
      <div style={{ ...base, display: "flex", alignItems: "center", gap: 8, ...(focus ? focusRing : null) }}>
        <Icon name="search" size={16} style={{ color: "var(--faint)" }} />
        <input
          value={open ? query : current ? current.label : query}
          placeholder={placeholder}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => { setFocus(true); setOpen(true); }}
          onBlur={() => { setFocus(false); setTimeout(() => setOpen(false), 120); }}
          style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontFamily: "var(--font-sans)", fontSize: "var(--text-body)", color: "var(--ink)", minWidth: 0 }}
        />
      </div>
      {open && (
        <ul style={{
          position: "absolute", insetInlineStart: 0, insetInlineEnd: 0, top: "calc(var(--control-height) + 4px)",
          margin: 0, padding: 4, listStyle: "none", background: "var(--surface)", border: "1px solid var(--line)",
          borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-overlay)", zIndex: "var(--z-overlay)", maxHeight: 220, overflow: "auto",
        }}>
          {list.length === 0 && <li style={{ padding: "9px 10px", fontSize: "var(--text-body)", color: "var(--muted)" }}>{emptyLabel}</li>}
          {list.map((o) => (
            <li key={o.value}>
              <button
                type="button"
                onMouseDown={() => { onChange && onChange(o.value); setQuery(""); setOpen(false); }}
                style={{ width: "100%", textAlign: "start", border: "none", cursor: "pointer", padding: "9px 10px", borderRadius: "var(--radius-xs)", background: "transparent", fontFamily: "var(--font-sans)", fontSize: "var(--text-body)", color: "var(--ink)" }}
              >
                {o.label}
                {o.meta && <span style={{ color: "var(--muted)", fontSize: "var(--text-meta)", marginInlineStart: 8, fontVariantNumeric: "tabular-nums" }}>{o.meta}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
