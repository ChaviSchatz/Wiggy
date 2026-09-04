import React from "react";
import { Icon } from "../core/Icon.jsx";
import { IconButton } from "../core/IconButton.jsx";

// The peek: inline-start edge, inset 14px, radius-md, floating shadow.
export function Drawer({ open, onClose, title, subtitle, footer, children, style }) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "var(--scrim)", zIndex: "var(--z-overlay)" }}>
      <aside
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "absolute", insetInlineStart: 12, top: 12, bottom: 12, width: "var(--drawer-width)",
          background: "var(--surface)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-overlay)",
          border: "1px solid var(--line)", display: "flex", flexDirection: "column", overflow: "hidden",
          fontFamily: "var(--font-sans)", ...style,
        }}
      >
        <header style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "14px 16px 13px", borderBottom: "1px solid var(--line)" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-identity-lg)", fontWeight: 600, letterSpacing: "-0.015em", color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</div>
            {subtitle && <div style={{ marginTop: 2, fontSize: 10.5, fontWeight: 400, letterSpacing: "0.01em", color: "var(--faint)", fontVariantNumeric: "tabular-nums" }}>{subtitle}</div>}
          </div>
          {onClose && <IconButton icon={<Icon name="x" size={16} strokeWidth={1.7} />} label="סגירה" onClick={onClose} />}
        </header>
        <div style={{ flex: 1, overflow: "auto", padding: "0 16px 16px" }}>{children}</div>
        {footer && (
          <footer style={{ padding: "12px 16px", borderTop: "1px solid var(--line)", background: "var(--surface-soft)", display: "flex", alignItems: "center", gap: 8 }}>{footer}</footer>
        )}
      </aside>
    </div>
  );
}
