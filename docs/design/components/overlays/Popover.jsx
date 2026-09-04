import React from "react";

export function Popover({ open, anchorAlign = "start", children, content, width = 260, style }) {
  return (
    <span style={{ position: "relative", display: "inline-flex", ...style }}>
      {children}
      {open && (
        <div
          role="dialog"
          style={{
            position: "absolute", top: "calc(100% + 6px)", [anchorAlign === "start" ? "insetInlineStart" : "insetInlineEnd"]: 0,
            width, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-overlay)", padding: 12, zIndex: "var(--z-overlay)",
            fontFamily: "var(--font-sans)", fontSize: "var(--text-body)", color: "var(--ink)",
          }}
        >
          {content}
        </div>
      )}
    </span>
  );
}
