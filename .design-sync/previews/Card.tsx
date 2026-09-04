import * as React from 'react';
import { Card, StatusChip, Avatar, Icon } from 'wiggy-design-system';

export function Default() {
  return (
    <Card style={{ padding: 14, width: 260 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 'var(--text-identity)', fontWeight: 700, color: 'var(--ink)' }}>רבקה כהן</span>
        <StatusChip status="active">פעיל</StatusChip>
      </div>
      <div style={{ fontSize: 'var(--text-meta)', color: 'var(--muted)' }}>WO-1041 · יעד 12.09.2026</div>
    </Card>
  );
}

export function Interactive() {
  const rows = [
    { name: 'מרים לוי', code: 'WO-1039', status: 'awaiting_approval', label: 'ממתין לאישור' },
    { name: 'דנה מזרחי', code: 'WO-1028', status: 'late', label: 'באיחור' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 300 }}>
      {rows.map((r) => (
        <Card key={r.code} interactive style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar name={r.name} size="sm" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{r.name}</div>
            <div style={{ fontSize: 11, color: 'var(--faint)' }}>{r.code}</div>
          </div>
          <StatusChip status={r.status}>{r.label}</StatusChip>
          <Icon name="chevron-left" size={16} style={{ color: 'var(--faint)' }} />
        </Card>
      ))}
    </div>
  );
}
