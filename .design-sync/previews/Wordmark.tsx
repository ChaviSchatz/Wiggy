import * as React from 'react';
import { Wordmark } from 'wiggy-design-system';

export function Light() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start' }}>
      <Wordmark />
      <Wordmark subtitle="מערכת ניהול הייצור" />
    </div>
  );
}

export function OnDark() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
      <div style={{ background: 'var(--sidebar)', padding: 16, borderRadius: 'var(--radius-md)' }}>
        <Wordmark onDark />
      </div>
      <div style={{ background: 'var(--sidebar)', padding: 16, borderRadius: 'var(--radius-md)' }}>
        <Wordmark subtitle="מערכת ניהול הייצור" onDark />
      </div>
    </div>
  );
}
