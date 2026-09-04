import * as React from 'react';
import { Checkbox } from 'wiggy-design-system';

export function Default() {
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <Checkbox checked label="ללא טופ" description="יוצר פריט חסר" />
      <Checkbox checked={false} label="דחוף" description="לשבץ לפני שאר התור" />
    </div>
  );
}

export function OrderFlags() {
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <Checkbox checked label="ללא טופ" />
      <Checkbox checked={false} label="החזרה ללקוחה" />
      <Checkbox checked label="אריזת מתנה" />
    </div>
  );
}

export function Disabled() {
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <Checkbox checked disabled label="הושלם" description="ננעל לאחר אישור" />
      <Checkbox checked={false} disabled label="ממתין לתשלום" />
    </div>
  );
}
