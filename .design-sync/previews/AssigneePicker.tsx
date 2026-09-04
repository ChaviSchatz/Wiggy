import * as React from 'react';
import { AssigneePicker } from 'wiggy-design-system';

const staff = [
  { id: '1', name: 'שירה לוי' },
  { id: '2', name: 'מיכל אברהם' },
  { id: '3', name: 'דנה פרץ' },
];

export function Assigned() {
  return (
    <div style={{ width: 220, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', padding: 10 }}>
      <AssigneePicker staff={staff} value="1" />
    </div>
  );
}

export function Unassigned() {
  return (
    <div style={{ width: 220, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', padding: 10 }}>
      <AssigneePicker staff={staff} value={null} />
    </div>
  );
}
