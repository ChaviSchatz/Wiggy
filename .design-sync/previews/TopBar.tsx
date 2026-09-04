import * as React from 'react';
import { TopBar, Button, IconButton, Icon } from 'wiggy-design-system';

export function Default() {
  return (
    <div style={{ width: 640, border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
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
    </div>
  );
}

export function MobileWithWordmark() {
  return (
    <div style={{ width: 420, border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
      <TopBar
        showWordmark
        actions={<IconButton icon={<Icon name="user" />} label="פרופיל" />}
      />
    </div>
  );
}
