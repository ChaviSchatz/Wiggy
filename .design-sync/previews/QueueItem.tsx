import * as React from 'react';
import { QueueItem } from 'wiggy-design-system';

export function Now() {
  return (
    <div style={{ maxWidth: 420 }}>
      <QueueItem
        customerName="רבקה כהן"
        orderCode="WO-1041"
        taskName="תפירה"
        status="now"
        statusLabel="עכשיו"
        meta="45 דק׳"
        onDone={() => {}}
      />
    </div>
  );
}

export function ReadyToStart() {
  return (
    <div style={{ maxWidth: 420 }}>
      <QueueItem
        customerName="מרים לוי"
        orderCode="WO-1039"
        taskName="גימור קצוות"
        status="next"
        statusLabel="הבא בתור"
        onStart={() => {}}
      />
    </div>
  );
}

export function DetailsOnly() {
  return (
    <div style={{ maxWidth: 420 }}>
      <QueueItem
        customerName="דנה פרץ"
        orderCode="WO-1044"
        taskName="בדיקת איכות"
        status="done"
        statusLabel="הושלם"
        onOpen={() => {}}
      />
    </div>
  );
}
