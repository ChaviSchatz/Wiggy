import React from "react";

// The drawer's section pattern promoted to a component: a title, optional count
// or action, and the 18×1.5px plum accent hairline underneath it (§6). Used on
// detail surfaces that sit directly on the page rather than inside a Panel.
// `size="sm"` is the form-group form — a 13px label, no hairline — for grouping
// fields inside a Dialog where an 18px Rubik heading would shout.
export function SectionHeading({ title, meta, actions, size = "default", style }) {
  const sm = size === "sm";
  return (
    <div style={{ marginBottom: sm ? 8 : 10, ...style }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, minWidth: 0 }}>
        <h2 style={sm ? {
          margin: 0, fontFamily: "var(--font-sans)", fontSize: "var(--text-label)", fontWeight: 600,
          lineHeight: "var(--leading-label)", color: "var(--ink)",
        } : {
          margin: 0, fontFamily: "var(--font-display)", fontSize: "var(--text-section)", fontWeight: 700,
          lineHeight: "var(--leading-section)", color: "var(--ink)",
        }}>{title}</h2>
        {meta != null && (
          <span style={{ fontSize: "var(--text-meta)", color: "var(--faint)", fontVariantNumeric: "tabular-nums" }}>{meta}</span>
        )}
        {actions && <div style={{ marginInlineStart: "auto", display: "flex", gap: 8, alignItems: "center" }}>{actions}</div>}
      </div>
      {!sm && <span aria-hidden="true" style={{ display: "block", width: 18, height: 1.5, marginTop: 6, borderRadius: 1, background: "var(--mauve-600)", opacity: 0.4 }} />}
    </div>
  );
}
