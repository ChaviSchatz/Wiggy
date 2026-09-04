import React from "react";
import { Icon } from "../core/Icon.jsx";
import { IconButton } from "../core/IconButton.jsx";

// radius-md, floating shadow, scrim rgba(45,24,43,.30). Focused forms and confirms.
export function Dialog({ open, onClose, title, description, footer, children, width = 460, style }) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "var(--scrim)", zIndex: "var(--z-overlay)", display: "grid", placeItems: "center", padding: 16 }}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        style={{
          width, maxWidth: "100%", background: "var(--surface)", borderRadius: "var(--radius-md)",
          boxShadow: "var(--shadow-overlay)", border: "1px solid var(--line)", overflow: "hidden",
          fontFamily: "var(--font-sans)", ...style,
        }}
      >
        <header style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "16px 18px 0" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "var(--text-section)", fontWeight: 700 }}>{title}</h2>
            {description && <p style={{ margin: "4px 0 0", fontSize: "var(--text-body)", color: "var(--muted)", textWrap: "pretty" }}>{description}</p>}
          </div>
          {onClose && <IconButton icon={<Icon name="x" size={18} />} label="סגירה" onClick={onClose} />}
        </header>
        <div style={{ padding: "16px 18px" }}>{children}</div>
        {footer && (
          <footer style={{ display: "flex", gap: 8, justifyContent: "flex-start", padding: "0 18px 18px" }}>{footer}</footer>
        )}
      </div>
    </div>
  );
}
