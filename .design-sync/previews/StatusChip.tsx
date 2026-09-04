import * as React from 'react';
import { StatusChip } from 'wiggy-design-system';

export function Filled() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      <StatusChip status="awaiting_approval">ממתין לאישור</StatusChip>
      <StatusChip status="in_progress">בעבודה</StatusChip>
      <StatusChip status="done">הושלם</StatusChip>
      <StatusChip status="blocked">חסום</StatusChip>
    </div>
  );
}

export function Quiet() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
      <StatusChip status="active" quiet>פעיל</StatusChip>
      <StatusChip status="pending" quiet>ממתין</StatusChip>
      <StatusChip status="completed" quiet>הושלם</StatusChip>
    </div>
  );
}

export function Sizes() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <StatusChip status="late" size="default">באיחור</StatusChip>
      <StatusChip status="late" size="lg">באיחור</StatusChip>
    </div>
  );
}
