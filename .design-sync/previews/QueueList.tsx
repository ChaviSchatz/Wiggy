import * as React from 'react';
import { QueueList, QueueItem } from 'wiggy-design-system';

export function MyWork() {
  return (
    <div style={{ maxWidth: 460 }}>
      <QueueList
        sections={[
          {
            id: 'now',
            title: 'עכשיו',
            items: [1],
            children: (
              <QueueItem
                customerName="רבקה כהן"
                orderCode="WO-1041"
                taskName="תפירה"
                status="now"
                statusLabel="עכשיו"
                meta="45 דק׳"
                onDone={() => {}}
              />
            ),
          },
          {
            id: 'next',
            title: 'הבא בתור',
            items: [1, 2],
            children: (
              <>
                <QueueItem
                  customerName="מרים לוי"
                  orderCode="WO-1039"
                  taskName="גימור קצוות"
                  status="next"
                  statusLabel="הבא בתור"
                  onStart={() => {}}
                />
                <QueueItem
                  customerName="דנה פרץ"
                  orderCode="WO-1044"
                  taskName="בדיקת איכות"
                  status="pending"
                  statusLabel="ממתין"
                  onStart={() => {}}
                />
              </>
            ),
          },
          {
            id: 'blocked',
            title: 'חסום',
            items: [1],
            description: 'ממתין לאישור לקוחה',
            children: (
              <QueueItem
                customerName="שרה אביטן"
                orderCode="WO-1032"
                taskName="תיקון תפר"
                status="blocked"
                statusLabel="חסום"
                onOpen={() => {}}
              />
            ),
          },
        ]}
      />
    </div>
  );
}
