import React from "react";
import { FormMessage } from "./FormMessage.jsx";

// label + control + description + error as one unit, so validation copy
// always lands in the same place relative to its input.
export function FormField({ label, htmlFor, description, error, required, children, style }) {
  return (
    <div style={{ display: "grid", gap: 6, ...style }}>
      {label && (
        <label htmlFor={htmlFor} style={{ fontSize: "var(--text-label)", fontWeight: 600, lineHeight: "var(--leading-label)", color: "var(--ink)" }}>
          {label}
          {required && <span style={{ color: "var(--danger-600)", marginInlineStart: 4 }}>*</span>}
        </label>
      )}
      {children}
      {description && !error && (
        <p style={{ margin: 0, fontSize: "var(--text-meta)", color: "var(--muted)" }}>{description}</p>
      )}
      {error && <FormMessage>{error}</FormMessage>}
    </div>
  );
}
