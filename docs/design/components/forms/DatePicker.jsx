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

// Dates are tabular and business-timezone bound (businesses.timezone).
export function DatePicker({ value, onChange, invalid, style, ...rest }) {
  const [focus, setFocus] = React.useState(false);
  return (
    <div style={{ position: "relative", ...style }}>
      <input
        type="date"
        value={value || ""}
        onChange={(e) => onChange && onChange(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        aria-invalid={invalid || undefined}
        style={{ ...base, paddingInlineEnd: 36, fontVariantNumeric: "tabular-nums", ...(invalid ? invalidRing : null), ...(focus ? focusRing : null) }}
        {...rest}
      />
      <Icon name="calendar" size={16} style={{ position: "absolute", insetInlineEnd: 12, top: 12, color: "var(--faint)", pointerEvents: "none" }} />
    </div>
  );
}
