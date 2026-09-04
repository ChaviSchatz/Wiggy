import * as React from 'react';
import { KanbanColumn, WorkCard } from 'wiggy-design-system';

export function WithCards() {
  return (
    <div style={{ width: 280, height: 360 }}>
      <KanbanColumn title="תפירה" subtitle="שלב 3" count={3}>
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
          status="awaiting_approval"
          statusLabel="ממתין לאישור"
          urgent
          urgencyLabel="דחוף"
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
      </KanbanColumn>
    </div>
  );
}

export function Empty() {
  return (
    <div style={{ width: 280, height: 220 }}>
      <KanbanColumn title="גימור" subtitle="שלב 5" count={0} emptyLabel="אין משימות בשלב זה" />
    </div>
  );
}
