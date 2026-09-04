import React from "react";
import { Icon } from "../core/Icon.jsx";

// Bottom inline-start, z-toast, short window, one action.
export function UndoToast({ open, message, actionLabel = "ביטול הפעולה", onAction, style }) {
  if (!open) return null;
  return (
    <div
      role="status"
      style={{
        position: "fixed", bottom: 20, insetInlineStart: 20, zIndex: "var(--z-toast)",
        display: "flex", alignItems: "center", gap: 12, padding: "11px 14px",
        background: "var(--mauve-900)", color: "#fff", borderRadius: "var(--radius-md)",
        boxShadow: "var(--shadow-overlay)", fontFamily: "var(--font-sans)", fontSize: "var(--text-body)", ...style,
      }}
    >
      <Icon name="check" size={16} />
      <span>{message}</span>
      <button
        type="button"
        onClick={onAction}
        style={{ border: "none", background: "transparent", color: "var(--mauve-200)", fontFamily: "var(--font-sans)", fontSize: "var(--text-body)", fontWeight: 600, cursor: "pointer", padding: 0 }}
      >
        {actionLabel}
      </button>
    </div>
  );
}
