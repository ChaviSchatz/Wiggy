import React from "react";
import { Icon } from "../core/Icon.jsx";

// Orientation for a multi-step creation workflow. `Stepper` tracks production
// stages of an existing order: 10px labels, dot-only nodes, never interactive.
// A wizard needs a legible label, a completed check, and a way back to a step
// already done — so this is a sibling, not a variant. Same colour logic:
// completed sage, current plum, upcoming line-strong.
export function WizardStepper({ steps = [], current = 0, onStepClick, style }) {
  return (
    <ol style={{
      display: "flex", alignItems: "center", listStyle: "none", margin: 0, padding: 0,
      gap: 0, minWidth: 0, ...style,
    }}>
      {steps.map((s, i) => {
        const label = typeof s === "string" ? s : s.label;
        const done = i < current;
        const active = i === current;
        const clickable = done && onStepClick;
        return (
          <li key={label} style={{ display: "flex", alignItems: "center", flex: i === steps.length - 1 ? "0 0 auto" : "1 1 auto" }}>
            <button
              type="button"
              onClick={clickable ? () => onStepClick(i) : undefined}
              aria-current={active ? "step" : undefined}
              disabled={!clickable}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8, minWidth: 0, flex: "none",
                border: "none", background: "transparent", padding: "4px 2px",
                cursor: clickable ? "pointer" : "default", fontFamily: "var(--font-sans)",
              }}
            >
              <span style={{
                width: 18, height: 18, flex: "none", borderRadius: "var(--radius-full)",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 600, fontVariantNumeric: "tabular-nums",
                background: active ? "var(--mauve-600)" : done ? "var(--sage-100)" : "var(--surface)",
                border: active ? "none" : done ? "1px solid var(--sage-200)" : "1px solid var(--line-strong)",
                color: active ? "#fff" : done ? "var(--sage-600)" : "var(--faint)",
                boxShadow: active ? "0 0 0 3px var(--mauve-100)" : "none",
              }}>
                {done ? <Icon name="check" size={11} strokeWidth={2.5} /> : i + 1}
              </span>
              <span style={{
                fontSize: 12.5, lineHeight: 1.3, whiteSpace: "nowrap",
                color: active ? "var(--mauve-600)" : done ? "var(--muted)" : "var(--faint)",
                fontWeight: active ? 600 : 400,
              }}>{label}</span>
            </button>
            {i < steps.length - 1 && (
              <span aria-hidden="true" style={{
                flex: "1 1 12px", minWidth: 12, height: 1, marginInline: 10,
                background: done ? "var(--sage-200)" : "var(--line)",
              }} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
