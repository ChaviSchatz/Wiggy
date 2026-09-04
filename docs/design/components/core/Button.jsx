import React from "react";

const H = { xs: 28, sm: 33, default: 37, primary: 38, lg: 44, icon: 37 };
const PAD = { xs: "0 9px", sm: "0 11px", default: "0 15px", primary: "0 16px", lg: "0 18px" };
const FS = { xs: 12, sm: 12.5, default: 13.5, primary: 13.5, lg: 14 };

const V = {
  primary: { background: "var(--mauve-600)", color: "#fff", border: "1px solid var(--mauve-600)" },
  outline: { background: "var(--surface)", color: "var(--ink)", border: "1px solid var(--line)" },
  ghost: { background: "transparent", color: "var(--ink)", border: "1px solid transparent" },
  soft: { background: "var(--mauve-100)", color: "var(--mauve-600)", border: "1px solid var(--mauve-200)" },
  "danger-soft": { background: "var(--danger-100)", color: "var(--danger-600)", border: "1px solid var(--danger-200)" },
  danger: { background: "var(--danger-600)", color: "#fff", border: "1px solid var(--danger-600)" },
  link: { background: "transparent", color: "var(--mauve-600)", border: "1px solid transparent", textDecoration: "underline", textUnderlineOffset: 3 },
};

const HOVER = {
  primary: "var(--mauve-700)", outline: "var(--surface-soft)", ghost: "var(--mauve-100)",
  soft: "var(--mauve-200)", "danger-soft": "var(--danger-200)", danger: "#a13c3c", link: "transparent",
};

export function Button({ variant = "primary", size, iconStart, iconEnd, disabled, children, style, ...rest }) {
  const [hover, setHover] = React.useState(false);
  const [focus, setFocus] = React.useState(false);
  const s = size || (variant === "primary" ? "primary" : "default");
  const v = V[variant] || V.primary;
  return (
    <button
      type="button"
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: s === "xs" ? 5 : 7,
        height: H[s], padding: s === "icon" ? 0 : PAD[s], width: s === "icon" ? H.icon : undefined,
        borderRadius: s === "xs" ? 8 : "var(--radius-xs)", fontFamily: "var(--font-sans)",
        fontSize: FS[s] || 13.5, fontWeight: 600, lineHeight: 1, cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1, whiteSpace: "nowrap",
        transition: "background-color 150ms cubic-bezier(0,0,.2,1), border-color 150ms cubic-bezier(0,0,.2,1)",
        boxShadow: focus ? "0 0 0 3px var(--mauve-100), 0 0 0 4px var(--mauve-600)" : "none",
        ...v,
        ...(hover && !disabled ? { background: HOVER[variant] } : null),
        ...style,
      }}
      {...rest}
    >
      {iconStart}
      {children}
      {iconEnd}
    </button>
  );
}
