import React from "react";
import { Icon } from "../core/Icon.jsx";

export function FormMessage({ tone = "error", children, style }) {
  const color = tone === "error" ? "var(--danger-600)" : "var(--muted)";
  return (
    <p role={tone === "error" ? "alert" : undefined} style={{ margin: 0, display: "flex", alignItems: "flex-start", gap: 6, fontSize: "var(--text-meta)", color, ...style }}>
      {tone === "error" && <Icon name="alert-circle" size={14} />}
      <span>{children}</span>
    </p>
  );
}
