import React from "react";
import { Icon } from "../core/Icon.jsx";
import { Button } from "../core/Button.jsx";

// Server pagination, page size 20.
export function Pagination({ page = 1, pageCount = 1, onPageChange, totalLabel, style }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14, ...style }}>
      {totalLabel && <span style={{ fontSize: "var(--text-meta)", color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>{totalLabel}</span>}
      <div style={{ marginInlineStart: "auto", display: "flex", alignItems: "center", gap: 8 }}>
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange && onPageChange(page - 1)} iconStart={<Icon name="chevron-right" size={16} />}>הקודם</Button>
        <span style={{ fontSize: "var(--text-meta)", color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>{page} / {pageCount}</span>
        <Button variant="outline" size="sm" disabled={page >= pageCount} onClick={() => onPageChange && onPageChange(page + 1)} iconEnd={<Icon name="chevron-left" size={16} />}>הבא</Button>
      </div>
    </div>
  );
}
