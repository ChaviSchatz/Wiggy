import React from "react";

const SZ = { xs: 22, sm: 26, md: 32, lg: 44 };

function monogram(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase();
}

// A circular avatar means exactly one thing in this product: a person who
// works here. Never a customer, never a wig, never a work item. The photoless
// fallback is a single plum tone — identity does not come from random colour.
export function Avatar({ name, src, size = "md", onDark, onClick, style, ...rest }) {
  const px = SZ[size] || SZ.md;
  return (
    <span
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? `${name} — שינוי אחראי` : name}
      title={name}
      style={{
        width: px, height: px, borderRadius: "var(--radius-full)", flex: "none",
        display: "inline-flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
        background: src ? "var(--idle-100)" : onDark ? "rgb(255 255 255 / 0.16)" : "var(--mauve-100)",
        color: onDark ? "#fff" : "var(--mauve-700)",
        fontFamily: "var(--font-sans)", fontSize: px <= 22 ? 9.5 : px <= 26 ? 10.5 : px <= 32 ? 12 : 15,
        fontWeight: 700, letterSpacing: "0.01em",
        boxShadow: onDark ? "none" : "inset 0 0 0 1px rgb(69 35 66 / 0.06)",
        cursor: onClick ? "pointer" : "default", ...style,
      }}
      {...rest}
    >
      {src ? <img src={src} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : monogram(name)}
    </span>
  );
}
