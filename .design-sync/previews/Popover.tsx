import * as React from 'react';
import { Popover, Button, AssigneePicker, Icon } from 'wiggy-design-system';

const staff = [
  { id: '1', name: 'שירה לוי' },
  { id: '2', name: 'מיכל אברהם' },
  { id: '3', name: 'דנה שמעוני' },
];

export function AssigneeSelect() {
  return (
    <div style={{ paddingTop: 40 }}>
      <Popover open anchorAlign="start" content={<AssigneePicker staff={staff} value="1" />}>
        <Button variant="outline">אחראי · שירה לוי</Button>
      </Popover>
    </div>
  );
}

export function QuickActions() {
  return (
    <div style={{ paddingTop: 40, display: 'flex', justifyContent: 'center' }}>
      <Popover
        open
        anchorAlign="end"
        width={200}
        content={
          <div style={{ display: 'grid', gap: 4 }}>
            <Button variant="ghost" size="sm">
              סימון כהושלם
            </Button>
            <Button variant="ghost" size="sm">
              העברה לתור אחר
            </Button>
            <Button variant="ghost" size="sm">
              ביטול שיבוץ
            </Button>
          </div>
        }
      >
        <Button variant="outline" size="sm" iconStart={<Icon name="ellipsis" size={16} />}>
          פעולות
        </Button>
      </Popover>
    </div>
  );
}
