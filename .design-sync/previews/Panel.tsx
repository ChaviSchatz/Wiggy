import * as React from 'react';
import { Panel, Button } from 'wiggy-design-system';

export function Default() {
  return (
    <Panel
      title="פרטי ההזמנה"
      subtitle="עודכן לפני 4 דקות"
      actions={<Button variant="ghost" size="sm">עריכה</Button>}
      style={{ width: 340 }}
    >
      <div style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.6 }}>
        הזמנה WO-1041 עבור רבקה כהן. פאה בעבודה, יעד מסירה 12.09.2026.
      </div>
    </Panel>
  );
}

export function NoActions() {
  return (
    <Panel title="הערות" style={{ width: 300 }}>
      <div style={{ fontSize: 13, color: 'var(--muted)' }}>אין הערות נוספות להזמנה זו.</div>
    </Panel>
  );
}
