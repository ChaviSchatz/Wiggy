import React from "react";

export function Tooltip({ label, children, style }) {
  const [show, setShow] = React.useState(false);
  return (
    <span
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
      style={{ position: "relative", display: "inline-flex", ...style }}
    >
      {children}
      {show && (
        <span
          role="tooltip"
          style={{
            position: "absolute", bottom: "calc(100% + 6px)", insetInlineStart: "50%", transform: "translateX(50%)",
            background: "var(--mauve-900)", color: "#fff", borderRadius: "var(--radius-xs)", padding: "5px 9px",
            fontSize: "var(--text-meta)", whiteSpace: "nowrap", zIndex: "var(--z-overlay)", pointerEvents: "none",
          }}
        >
          {label}
        </span>
      )}
    </span>
  );
}
