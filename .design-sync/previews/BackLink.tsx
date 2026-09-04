import * as React from 'react';
import { BackLink } from 'wiggy-design-system';

export function Default() {
  return <BackLink label="חזרה ללוח הייצור" onClick={() => {}} />;
}

export function InContext() {
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <BackLink label="חזרה להזמנות" onClick={() => {}} />
      <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'var(--text-page)', fontWeight: 'var(--text-page-weight)', color: 'var(--ink)' }}>
        הזמנה WO-1041
      </h1>
    </div>
  );
}
