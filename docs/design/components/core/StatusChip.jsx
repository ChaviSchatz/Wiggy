import React from "react";

// The one place domain vocabulary maps to colour. Callers pass meaning, never colour.
const MAP = {
  // task status (messages/he.json pages.orders.taskStatus)
  pending: "idle", in_progress: "info", awaiting_approval: "peach", returned_for_rework: "danger",
  done: "sage", deferred: "idle", skipped: "idle", cancelled: "idle",
  // order status (pages.orders.status)
  draft: "idle", confirmed: "info", active: "info", ready_for_handoff: "peach",
  completed: "sage", on_hold: "peach", delivered: "sage",
  // missing items (pages.missingItems.status)
  open: "danger", found: "peach", ordered: "peach", handled: "sage",
  // availability / urgency — two levels plus blocked (ADR 0012); "normal" is absence
  urgent: "danger", blocked: "danger", now: "mauve", next: "info", due_soon: "peach", approval_queue: "mauve",
};

// `quiet` drops the tinted ground and keeps only the dot and the word. Dense
// surfaces — a board column of a dozen cards — use it for ordinary flow so the
// filled chip stays rare enough to still mean "look here".
export function StatusChip({ status, family, children, size = "default", dot = true, quiet, style, ...rest }) {
  const fam = family || MAP[status] || "idle";
  const dotEl = dot ? <span style={{ width: quiet ? 4 : 5, height: quiet ? 4 : 5, borderRadius: "var(--radius-full)", background: `var(--${fam}-500)`, flex: "none" }} /> : null;
  const label = <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{children}</span>;
  if (quiet) {
    return (
      <span
        style={{
          display: "inline-flex", alignItems: "center", gap: 4, minWidth: 0, color: "var(--muted)",
          fontFamily: "var(--font-sans)", fontSize: size === "lg" ? "var(--text-meta)" : "var(--text-micro)",
          fontWeight: 500, lineHeight: 1.5, whiteSpace: "nowrap", ...style,
        }}
        {...rest}
      >
        {dotEl}{label}
      </span>
    );
  }
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 5, minWidth: 0, borderRadius: "var(--radius-full)",
        padding: size === "lg" ? "5px 11px" : "2px 8px",
        background: `var(--${fam}-100)`, color: `var(--${fam}-600)`,
        fontFamily: "var(--font-sans)", fontSize: size === "lg" ? "var(--text-meta)" : "var(--text-micro)",
        fontWeight: 600, lineHeight: 1.5, whiteSpace: "nowrap", ...style,
      }}
      {...rest}
    >
      {dotEl}{label}
    </span>
  );
}
