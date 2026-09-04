import React from "react";
import { Icon } from "../core/Icon.jsx";

const base = {
  height: "var(--control-height)", width: "100%", boxSizing: "border-box", padding: "0 11px",
  borderRadius: "var(--radius-xs)", border: "1px solid var(--line)", background: "var(--surface)",
  color: "var(--ink)", fontFamily: "var(--font-sans)", fontSize: 13, outline: "none",
  transition: "border-color 150ms cubic-bezier(0,0,.2,1), box-shadow 150ms cubic-bezier(0,0,.2,1)",
};
const focusRing = { borderColor: "var(--mauve-600)", boxShadow: "0 0 0 3px var(--mauve-100)" };
const invalidRing = { borderColor: "var(--danger-500)" };

// A real primitive — never a native <select> with a copy-pasted class string.
export function Select({ options = [], value, onChange, placeholder = "בחרי…", invalid, style, ...rest }) {
  const [open, setOpen] = React.useState(false);
  const [focus, setFocus] = React.useState(false);
  const current = options.find((o) => o.value === value);
  return (
    <div style={{ position: "relative", ...style }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        onFocus={() => setFocus(true)}
        onBlur={() => { setFocus(false); setTimeout(() => setOpen(false), 120); }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-invalid={invalid || undefined}
        {...rest}
        style={{ ...base, display: "flex", alignItems: "center", gap: 8, cursor: "pointer", textAlign: "start", ...(invalid ? invalidRing : null), ...(focus ? focusRing : null) }}
      >
        <span style={{ flex: 1, color: current ? "var(--ink)" : "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {current ? current.label : placeholder}
        </span>
        <Icon name="chevron-down" size={14} strokeWidth={1.7} style={{ color: "var(--faint)" }} />
      </button>
      {open && (
        <ul
          role="listbox"
          style={{
            position: "absolute", insetInlineStart: 0, insetInlineEnd: 0, top: "calc(var(--control-height) + 4px)",
            margin: 0, padding: 4, listStyle: "none", background: "var(--surface)", border: "1px solid var(--line)",
            borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-overlay)", zIndex: "var(--z-overlay)", maxHeight: 220, overflow: "auto",
          }}
        >
          {options.map((o) => (
            <li key={o.value}>
              <button
                type="button"
                role="option"
                aria-selected={o.value === value}
                onMouseDown={() => { onChange && onChange(o.value); setOpen(false); }}
                style={{
                  width: "100%", textAlign: "start", border: "none", cursor: "pointer",
                  padding: "8px 10px", borderRadius: 8, fontFamily: "var(--font-sans)",
                  fontSize: 13,
                  background: o.value === value ? "var(--mauve-100)" : "transparent",
                  color: o.value === value ? "var(--mauve-600)" : "var(--ink)",
                  fontWeight: o.value === value ? 600 : 400,
                }}
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
