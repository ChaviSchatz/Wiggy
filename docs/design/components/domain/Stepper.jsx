import React from "react";
import { Icon } from "../core/Icon.jsx";

// Order progress. Completed sage-600, current mauve-600, upcoming line-strong
// outline; connector sage-300 behind completed segments, line ahead.
export function Stepper({ steps = [], current = 0, style }) {
  return (
    <ol style={{ display: "flex", alignItems: "flex-start", listStyle: "none", margin: 0, padding: 0, gap: 0, ...style }}>
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        const label = typeof s === "string" ? s : s.label;
        return (
          <li key={label} style={{ display: "flex", alignItems: "flex-start", flex: i === steps.length - 1 ? "0 0 auto" : "1 1 0", minWidth: 0 }}>
            <div style={{ display: "grid", justifyItems: "center", gap: 5, minWidth: 0, paddingInline: 2 }}>
              <span style={{
                width: active ? 10 : 8, height: active ? 10 : 8, marginTop: active ? 1 : 2, flex: "none",
                borderRadius: "var(--radius-full)",
                background: active ? "var(--mauve-600)" : done ? "var(--sage-200)" : "var(--surface)",
                border: active ? "none" : done ? "1px solid var(--sage-300)" : "1px solid var(--line-strong)",
                boxShadow: active ? "0 0 0 3px var(--mauve-100)" : "none",
              }} />
              <span style={{
                fontSize: 10, lineHeight: 1.3, textAlign: "center", whiteSpace: "nowrap",
                overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%",
                color: active ? "var(--mauve-600)" : done ? "var(--muted)" : "var(--faint)",
                fontWeight: active ? 600 : 400,
              }}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <span style={{ flex: 1, height: 1, marginTop: 6, background: done ? "var(--sage-300)" : "var(--line)" }} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
