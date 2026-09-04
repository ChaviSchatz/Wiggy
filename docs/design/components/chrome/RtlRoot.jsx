import React from "react";

// Preview-harness wrapper only (see .design-sync/config.json cfg.provider).
// Wiggy is Hebrew-first: "Direction lives at the root. dir is set on the
// screen container; components inherit it." (WIGGY_DESIGN_SYSTEM.md §19).
// Every component assumes an ambient dir="rtl" — this reproduces that root
// for preview cards so cards match real usage instead of defaulting to LTR.
export function RtlRoot({ children }) {
  return (
    <div
      dir="rtl"
      lang="he"
      style={{
        fontFamily: "var(--font-sans)",
        color: "var(--ink)",
        background: "var(--bg)",
      }}
    >
      {children}
    </div>
  );
}
