import React from "react";
import { Card } from "../core/Card.jsx";
import { StatusChip } from "../core/StatusChip.jsx";
import { WorkImage } from "../core/WorkImage.jsx";
import { Button } from "../core/Button.jsx";
import { Icon } from "../core/Icon.jsx";

// A row in the personal queue. Tablet-first: 44px targets, generous padding.
export function QueueItem({ customerName, orderCode, taskName, status, statusLabel, referencePhotoUrl, meta, onStart, onDone, onOpen, style }) {
  return (
    <Card interactive style={{ padding: 14, display: "flex", alignItems: "center", gap: 14, ...style }}>
      <WorkImage src={referencePhotoUrl} alt="" size={56} />
      <div style={{ minWidth: 0, flex: 1, display: "grid", gap: 3 }}>
        <div style={{ fontSize: "var(--text-identity)", fontWeight: 700 }}>{customerName}</div>
        <div style={{ fontSize: "var(--text-meta)", color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>
          {orderCode}{taskName ? " · " + taskName : ""}{meta ? " · " + meta : ""}
        </div>
        {status && <div><StatusChip status={status}>{statusLabel}</StatusChip></div>}
      </div>
      <div style={{ display: "flex", gap: 8, flex: "none" }}>
        {onDone && <Button size="lg" onClick={onDone} iconStart={<Icon name="check" size={16} />}>סיום</Button>}
        {onStart && <Button size="lg" variant="outline" onClick={onStart}>התחלה</Button>}
        {onOpen && <Button size="lg" variant="ghost" onClick={onOpen} iconStart={<Icon name="chevron-left" size={16} />}>פרטים</Button>}
      </div>
    </Card>
  );
}
