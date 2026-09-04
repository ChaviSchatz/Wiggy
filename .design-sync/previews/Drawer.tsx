import * as React from 'react';
import { Drawer, Button, StatusChip, DetailList } from 'wiggy-design-system';

// The wrapper needs its own transform + explicit height: Drawer's root is
// `position:fixed; inset:0`, so it needs a sized containing block or the
// panel collapses to auto-height's zero in a static capture harness.
export function OrderPeek() {
  return (
    <div style={{ position: 'relative', height: 500, width: 480, transform: 'translateZ(0)', overflow: 'hidden', borderRadius: 12 }}>
      <Drawer
        open
        onClose={() => {}}
        title="רבקה כהן"
        subtitle="WO-1041 · תפירה"
        footer={
          <>
            <Button size="sm">סיום</Button>
            <Button size="sm" variant="outline">
              דחייה
            </Button>
          </>
        }
      >
        <div style={{ display: 'grid', gap: 12, paddingTop: 12 }}>
          <StatusChip status="in_progress">בעבודה</StatusChip>
          <DetailList
            columns={1}
            items={[
              { label: 'תאריך יעד', value: '12.09.2026', numeric: true },
              { label: 'משימות שהושלמו', value: '8 / 11', numeric: true },
              { label: 'שובצה ל', value: 'מרים לוי' },
            ]}
          />
        </div>
      </Drawer>
    </div>
  );
}
