import React from "react";
import { Icon } from "../core/Icon.jsx";

export function Checkbox({ checked, onChange, label, description, disabled, style }) {
  return (
    <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, minHeight: 24, ...style }}>
      <span
        onClick={() => !disabled && onChange && onChange(!checked)}
        style={{
          width: 20, height: 20, flex: "none", borderRadius: 6, marginTop: 1,
          border: `1px solid ${checked ? "var(--mauve-600)" : "var(--line-strong)"}`,
          background: checked ? "var(--mauve-600)" : "var(--surface)",
          display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff",
          transition: "background-color 150ms cubic-bezier(0,0,.2,1)",
        }}
        role="checkbox"
        aria-checked={!!checked}
        tabIndex={0}
      >
        {checked && <Icon name="check" size={14} strokeWidth={2.5} />}
      </span>
      {(label || description) && (
        <span style={{ display: "grid", gap: 2 }}>
          {label && <span style={{ fontSize: "var(--text-body)", color: "var(--ink)" }}>{label}</span>}
          {description && <span style={{ fontSize: "var(--text-meta)", color: "var(--muted)" }}>{description}</span>}
        </span>
      )}
    </label>
  );
}
