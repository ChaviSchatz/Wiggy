import * as React from 'react';
import { Toggle } from 'wiggy-design-system';

export function States() {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <Toggle checked label="תבנית פעילה" />
      <Toggle checked={false} label="שליחת תזכורות SMS" />
    </div>
  );
}

export function Disabled() {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <Toggle checked disabled label="חיוב אוטומטי" />
      <Toggle checked={false} disabled label="גישת צוות חיצוני" />
    </div>
  );
}
