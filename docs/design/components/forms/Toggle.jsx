import React from "react";

export function Toggle({ checked, onChange, label, disabled, style }) {
  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: 10, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, ...style }}>
      <span
        role="switch"
        aria-checked={!!checked}
        tabIndex={0}
        onClick={() => !disabled && onChange && onChange(!checked)}
        style={{
          width: 40, height: 24, borderRadius: "var(--radius-full)", flex: "none", position: "relative",
          background: checked ? "var(--mauve-600)" : "var(--idle-200)",
          transition: "background-color 150ms cubic-bezier(0,0,.2,1)",
        }}
      >
        <span style={{
          position: "absolute", top: 3, insetInlineStart: checked ? 19 : 3, width: 18, height: 18,
          borderRadius: "var(--radius-full)", background: "#fff",
          transition: "inset-inline-start 150ms cubic-bezier(0,0,.2,1)",
        }} />
      </span>
      {label && <span style={{ fontSize: "var(--text-body)" }}>{label}</span>}
    </label>
  );
}
