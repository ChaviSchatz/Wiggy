import * as React from 'react';
import { BottomNav } from 'wiggy-design-system';

const items = [
  { id: 'my-work', label: 'העבודה שלי', icon: 'list-checks' },
  { id: 'board', label: 'לוח ייצור', icon: 'columns-3' },
  { id: 'orders', label: 'הזמנות', icon: 'package' },
  { id: 'profile', label: 'פרופיל', icon: 'user' },
];

export function Default() {
  return (
    <div style={{ maxWidth: 420, border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
      <BottomNav items={items} activeId="my-work" onSelect={() => {}} />
    </div>
  );
}
