import * as React from 'react';
import { SideNav } from 'wiggy-design-system';

const items = [
  { id: 'home', label: 'בית', icon: 'layout-dashboard' },
  { id: 'my-work', label: 'העבודה שלי', icon: 'list-checks', count: 6 },
  { id: 'board', label: 'לוח ייצור', icon: 'columns-3' },
  { id: 'orders', label: 'הזמנות', icon: 'package' },
  { id: 'customers', label: 'לקוחות', icon: 'users' },
];

export function Default() {
  return (
    <div style={{ height: 480, display: 'flex' }}>
      <SideNav
        items={items}
        activeId="board"
        onSelect={() => {}}
        brandSubtitle="מערכת ניהול הייצור"
        user={{ name: 'פראדי כהן', role: 'מנהלת' }}
      />
    </div>
  );
}
