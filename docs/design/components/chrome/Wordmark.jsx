import React from "react";

// Wiggy: Rubik, tight, plum — beside a delicate five-strand mark. The mark is
// drawn from hairlines on purpose; it must never read as an illustration.
export function WiggyMark({ size = 22, color = "currentColor", style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true"
         style={{ flex: "none", display: "block", ...style }}>
      <g stroke={color} strokeWidth="1.1" strokeLinecap="round" opacity="0.95">
        <path d="M12 20.5V9" />
        <path d="M12 12.2C12 9 10.1 6.3 7.2 5.1" />
        <path d="M12 12.2C12 9 13.9 6.3 16.8 5.1" />
        <path d="M12 15.4c0-2.6-1.5-4.8-3.9-5.9" />
        <path d="M12 15.4c0-2.6 1.5-4.8 3.9-5.9" />
      </g>
      <circle cx="12" cy="7.2" r="1.15" fill={color} />
    </svg>
  );
}

export function Wordmark({ text = "Wiggy", subtitle, onDark, size = 21, style }) {
  const fg = onDark ? "var(--sidebar-mark)" : "var(--mauve-600)";
  return (
    <div style={{ display: "grid", gap: 2, ...style }}>
      <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <span style={{
          fontFamily: "var(--font-display)", fontWeight: 700, letterSpacing: "-0.03em",
          fontSize: size, lineHeight: 1.1, color: onDark ? "#fff" : "var(--mauve-600)",
        }}>{text}</span>
        <WiggyMark size={size * 0.95} color={fg} style={{ opacity: onDark ? 0.9 : 1 }} />
      </span>
      {subtitle && (
        <span style={{ fontSize: "var(--text-micro)", letterSpacing: "0.01em", color: onDark ? "var(--sidebar-fg-dim)" : "var(--muted)" }}>{subtitle}</span>
      )}
    </div>
  );
}
