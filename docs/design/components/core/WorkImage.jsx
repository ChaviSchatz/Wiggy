import React from "react";

// Squared reference/work thumbnail. Rendered only when an image exists —
// no placeholder, no reserved slot.
export function WorkImage({ src, alt = "", size = 56, style, ...rest }) {
  if (!src) return null;
  return (
    <img
      src={src}
      alt={alt}
      style={{
        width: size, height: size, objectFit: "cover", borderRadius: "var(--radius-xs)",
        border: "1px solid var(--line)", flex: "none", display: "block", ...style,
      }}
      {...rest}
    />
  );
}
