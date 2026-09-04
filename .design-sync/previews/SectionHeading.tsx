import * as React from 'react';
import { SectionHeading, Button } from 'wiggy-design-system';

export function Default() {
  return (
    <SectionHeading
      title="הזמנות פעילות"
      meta="2"
      actions={<Button variant="ghost" size="sm">הכול</Button>}
      style={{ width: 320 }}
    />
  );
}

export function FormGroup() {
  return (
    <div style={{ width: 280 }}>
      <SectionHeading title="פרטי קשר" size="sm" />
      <div style={{ fontSize: 12, color: 'var(--muted)' }}>שם, טלפון ודוא״ל של הלקוחה</div>
    </div>
  );
}
