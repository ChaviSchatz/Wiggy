import React from "react";
import { Icon } from "../core/Icon.jsx";

// Chevron flips with writing direction: the caller is in an RTL document,
// so "back" points inline-end. Use dir-aware icon names.
export function BackLink({ label, onClick, rtl = true, style }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none",
        padding: 0, cursor: "pointer", color: "var(--mauve-600)", fontFamily: "var(--font-sans)",
        fontSize: "var(--text-body)", fontWeight: 600, ...style,
      }}
    >
      <Icon name={rtl ? "chevron-right" : "chevron-left"} size={16} />
      {label}
    </button>
  );
}
