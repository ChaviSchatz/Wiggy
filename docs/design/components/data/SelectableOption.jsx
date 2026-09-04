import React from "react";
import { Icon } from "../core/Icon.jsx";

// One operational choice in a list of choices: a customer search result, an
// intake template, a configured option. `RadioGroup` is a single-line control
// for a small fixed set; this carries an identity line, quiet metadata and a
// trailing value, and it is what a configuration-driven list of options renders
// into. Selected is a plum outline on a plum wash — the same selected state a
// radio row uses — never a filled plum block.
export function SelectableOption({
  selected, onSelect, title, meta, description, trailing, indicator = "radio", disabled, style,
}) {
  const [hover, setHover] = React.useState(false);
  const [focus, setFocus] = React.useState(false);
  return (
    <div
      role="option"
      aria-selected={!!selected}
      tabIndex={disabled ? -1 : 0}
      onClick={disabled ? undefined : onSelect}
      onKeyDown={(e) => { if (!disabled && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onSelect && onSelect(); } }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      style={{
        display: "grid", gridTemplateColumns: "18px minmax(0,1fr) auto", alignItems: "center", gap: 12,
        minHeight: 44, padding: "10px 14px", boxSizing: "border-box",
        borderRadius: "var(--radius-xs)", background: selected ? "var(--mauve-100)" : "var(--surface)",
        border: `1px solid ${selected ? "var(--mauve-600)" : hover && !disabled ? "var(--line-strong)" : "var(--line)"}`,
        boxShadow: focus ? "0 0 0 3px var(--mauve-100)" : "none",
        cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, outline: "none",
        transition: "background-color 150ms cubic-bezier(0,0,.2,1), border-color 150ms cubic-bezier(0,0,.2,1)",
      }}
    >
      <span aria-hidden="true" style={{
        width: 18, height: 18, borderRadius: "var(--radius-full)", flex: "none",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        border: `1px solid ${selected ? "var(--mauve-600)" : "var(--line-strong)"}`,
        background: selected && indicator === "check" ? "var(--mauve-600)" : "var(--surface)",
        color: "#fff",
      }}>
        {selected && (indicator === "check"
          ? <Icon name="check" size={12} strokeWidth={2.5} />
          : <span style={{ width: 8, height: 8, borderRadius: "var(--radius-full)", background: "var(--mauve-600)" }} />)}
      </span>
      <span style={{ display: "grid", gap: 2, minWidth: 0 }}>
        <span style={{ display: "flex", alignItems: "baseline", gap: 8, minWidth: 0 }}>
          <span style={{
            fontSize: "var(--text-identity)", fontWeight: 600, color: selected ? "var(--mauve-600)" : "var(--ink)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>{title}</span>
          {meta && <span style={{ fontSize: "var(--text-meta)", color: "var(--muted)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{meta}</span>}
        </span>
        {description && <span style={{ fontSize: "var(--text-meta)", color: "var(--muted)", textWrap: "pretty" }}>{description}</span>}
      </span>
      {trailing && <span style={{ fontSize: "var(--text-meta)", color: "var(--faint)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{trailing}</span>}
    </div>
  );
}
