import React from "react";

export function RadioGroup({ options = [], value, onChange, name, style }) {
  return (
    <div role="radiogroup" style={{ display: "grid", gap: 8, ...style }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <label
            key={o.value}
            style={{
              display: "flex", alignItems: "center", gap: 10, cursor: "pointer", minHeight: 44,
              padding: "0 12px", borderRadius: "var(--radius-xs)",
              border: `1px solid ${active ? "var(--mauve-600)" : "var(--line-strong)"}`,
              background: active ? "var(--mauve-100)" : "var(--surface)",
            }}
          >
            <input
              type="radio"
              name={name}
              checked={active}
              onChange={() => onChange && onChange(o.value)}
              style={{ accentColor: "var(--mauve-600)", width: 16, height: 16 }}
            />
            <span style={{ fontSize: "var(--text-body)", color: active ? "var(--mauve-600)" : "var(--ink)", fontWeight: active ? 600 : 400 }}>{o.label}</span>
          </label>
        );
      })}
    </div>
  );
}
