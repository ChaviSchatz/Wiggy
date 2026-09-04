import * as React from 'react';
import { Skeleton } from 'wiggy-design-system';

export function TableRows() {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', padding: 16, display: 'grid', gap: 12 }}>
      <Skeleton lines={4} />
      <Skeleton height={26} width="45%" />
    </div>
  );
}

export function KpiCard() {
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ flex: '1 1 0', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', padding: 16, display: 'grid', gap: 10 }}>
          <Skeleton height={11} width="55%" />
          <Skeleton height={28} width="70%" />
          <Skeleton height={11} width="40%" />
        </div>
      ))}
    </div>
  );
}
