import * as React from 'react';
import { DetailList } from 'wiggy-design-system';

export function TwoColumn() {
  return (
    <DetailList
      columns={2}
      items={[
        { label: 'שם מלא', value: 'רבקה כהן' },
        { label: 'טלפון', value: '050-1234567', numeric: true },
        { label: 'דוא״ל', value: 'rivka.cohen@example.com' },
        { label: 'קוד הזמנה', value: 'WO-1041', numeric: true },
        { label: 'תאריך יעד', value: '12.09.2026', numeric: true },
        { label: 'הערות', value: null },
      ]}
    />
  );
}

export function SingleColumn() {
  return (
    <DetailList
      columns={1}
      style={{ maxWidth: 280 }}
      items={[
        { label: 'סטטוס', value: 'ממתין לאישור' },
        { label: 'משימות שהושלמו', value: '8 / 11', numeric: true },
        { label: 'שובצה ל', value: 'מרים לוי' },
      ]}
    />
  );
}
