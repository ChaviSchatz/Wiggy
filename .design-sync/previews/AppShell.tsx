import * as React from 'react';
import { AppShell, SideNav, TopBar, PageHeader, BackLink, Button, IconButton, Icon, DetailList } from 'wiggy-design-system';

const items = [
  { id: 'home', label: 'בית', icon: 'layout-dashboard' },
  { id: 'my-work', label: 'העבודה שלי', icon: 'list-checks', count: 6 },
  { id: 'board', label: 'לוח ייצור', icon: 'columns-3' },
  { id: 'orders', label: 'הזמנות', icon: 'package' },
  { id: 'customers', label: 'לקוחות', icon: 'users' },
];

export function Default() {
  return (
    <div style={{ height: 780, border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
      <AppShell
        sideNav={
          <SideNav
            items={items}
            activeId="board"
            onSelect={() => {}}
            brandSubtitle="מערכת ניהול הייצור"
            user={{ name: 'פראדי כהן', role: 'מנהלת' }}
          />
        }
        topBar={
          <TopBar
            actions={
              <>
                <Button iconStart={<Icon name="plus" size={16} />}>הזמנה חדשה</Button>
                <IconButton icon={<Icon name="message-square" />} label="משוב" />
              </>
            }
            user={{ name: 'פראדי כהן', role: 'מנהלת' }}
            onUser={() => {}}
          />
        }
      >
        <PageHeader
          title="לוח ייצור"
          subtitle="24 משימות פעילות"
          backLink={<BackLink label="חזרה ללוח הייצור" onClick={() => {}} />}
          actions={<Button variant="soft">סינון</Button>}
        />
        <DetailList
          columns={2}
          items={[
            { label: 'הזמנה', value: 'WO-1041' },
            { label: 'לקוחה', value: 'רבקה כהן' },
            { label: 'תאריך יעד', value: '12.09.2026', numeric: true },
            { label: 'משימות שהושלמו', value: '8 / 11', numeric: true },
          ]}
        />
      </AppShell>
    </div>
  );
}
