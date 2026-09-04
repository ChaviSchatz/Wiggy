import React from "react";

// Design-system only: marks where a reference photo would render.
// The product renders no placeholder — see WorkImage.
export function ImageSlot({ label = "reference photo", size = 56, radius = "var(--radius-xs)", style }) {
  return (
    <div
      style={{
        width: size, height: size, borderRadius: radius, border: "1px dashed var(--line-strong)",
        background: "repeating-linear-gradient(45deg, var(--idle-100) 0 7px, var(--surface) 7px 14px)",
        opacity: 0.9,
        display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center",
        fontFamily: "ui-monospace, Menlo, monospace", fontSize: 10, color: "var(--muted)",
        padding: 4, flex: "none", ...style,
      }}
    >
      {label}
    </div>
  );
}
