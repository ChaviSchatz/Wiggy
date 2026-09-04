import * as React from 'react';
import { KpiCard } from 'wiggy-design-system';

export function Dashboard() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, maxWidth: 420 }}>
      <KpiCard label="הזמנות פעילות" value="24" caption="3 באיחור" emphasis eyebrow="דורש טיפול" />
      <KpiCard label="ממתין לאישור" value="6" caption="מתוך 11 משימות" />
      <KpiCard label="נמסרו החודש" value="58" caption="לעומת 51 בחודש שעבר" />
      <KpiCard label="זמן טיפול ממוצע" value="3.2 ימים" />
    </div>
  );
}
