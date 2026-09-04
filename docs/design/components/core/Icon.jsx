import React from "react";
import { icons } from "lucide-react";

// lucide-react, same as the product (package.json already depends on it).
// 1.5px stroke default, currentColor.
const pascal = (n) =>
  String(n).split(/[-_]/).map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join("");

export function Icon({ name, size = 20, strokeWidth = 1.5, style, ...rest }) {
  const LucideIcon = icons[pascal(name)];
  if (!LucideIcon) return null;
  return (
    <LucideIcon
      size={size}
      strokeWidth={strokeWidth}
      aria-hidden="true"
      style={{ flex: "none", display: "block", ...style }}
      {...rest}
    />
  );
}
