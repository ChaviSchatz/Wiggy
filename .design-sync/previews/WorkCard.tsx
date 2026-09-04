import * as React from 'react';
import { WorkCard } from 'wiggy-design-system';

export function Board() {
  return (
    <div style={{ display: 'grid', gap: 8, width: 260 }}>
      <WorkCard
        variant="board"
        customerName="רבקה כהן"
        orderCode="WO-1041"
        taskName="תפירת בסיס"
        status="in_progress"
        statusLabel="בעבודה"
        assignee="שירה לוי"
        due="12.09"
        onDone={() => {}}
      />
      <WorkCard
        variant="board"
        customerName="מרים לוי"
        orderCode="WO-1039"
        taskName="תפירת קדמי"
        urgent
        urgencyLabel="דחוף"
        status="awaiting_approval"
        statusLabel="ממתין לאישור"
        assignee="מיכל אברהם"
        onStart={() => {}}
      />
      <WorkCard
        variant="board"
        customerName="דנה פרץ"
        orderCode="WO-1044"
        taskName="תפירת גב"
        blocked
        assignee="שירה לוי"
        onOpen={() => {}}
      />
    </div>
  );
}

export function Planning() {
  return (
    <div style={{ display: 'grid', gap: 8, width: 300 }}>
      <WorkCard
        variant="planning"
        customerName="שרה אביטן"
        orderCode="WO-1032"
        taskName="תיקון תפר"
        status="pending"
        statusLabel="ממתין"
        assignee="מיכל אברהם"
        due="15.09"
        onMoveUp={() => {}}
        onMoveDown={() => {}}
      />
      <WorkCard
        variant="planning"
        customerName="רבקה כהן"
        orderCode="WO-1041"
        taskName="תפירת בסיס"
        status="in_progress"
        statusLabel="בעבודה"
        assignee="שירה לוי"
        due="12.09"
        onMoveUp={() => {}}
        onMoveDown={() => {}}
      />
    </div>
  );
}

export function Queue() {
  return (
    <div style={{ display: 'grid', gap: 10, width: 360 }}>
      <WorkCard
        variant="queue"
        customerName="רבקה כהן"
        orderCode="WO-1041"
        taskName="תפירה"
        status="in_progress"
        statusLabel="בעבודה"
        assignee="שירה לוי"
        due="12.09"
        onDone={() => {}}
      />
    </div>
  );
}
