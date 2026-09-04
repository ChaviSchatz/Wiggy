import React from "react";

// Structural skeleton matching the shape of what is arriving. Never a spinner.
export function Skeleton({ height = 14, width = "100%", radius = "var(--radius-xs)", lines = 1, style }) {
  const bar = (i) => (
    <span key={i} style={{
      display: "block", height, width: lines > 1 && i === lines - 1 ? "62%" : width,
      borderRadius: radius, background: "var(--idle-100)",
      animation: "wf-pulse 1400ms cubic-bezier(0,0,.2,1) infinite",
    }} />
  );
  return (
    <span style={{ display: "grid", gap: 8, ...style }}>
      <style>{"@keyframes wf-pulse{0%,100%{opacity:1}50%{opacity:.55}}@media (prefers-reduced-motion:reduce){[style*='wf-pulse']{animation:none!important}}"}</style>
      {Array.from({ length: lines }, (_, i) => bar(i))}
    </span>
  );
}
