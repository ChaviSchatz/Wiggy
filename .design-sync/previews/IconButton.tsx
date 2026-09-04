import * as React from 'react';
import { IconButton, Icon } from 'wiggy-design-system';

export function TopBarActions() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <IconButton icon={<Icon name="message-square" />} label="משוב" />
      <IconButton icon={<Icon name="bell" />} label="התראות" />
      <IconButton icon={<Icon name="user" />} label="פרופיל" />
    </div>
  );
}

export function RowAction() {
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: 10,
        border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', width: 260,
      }}
    >
      <span style={{ flex: 1, fontSize: 13, color: 'var(--ink)' }}>WO-1041 · רבקה כהן</span>
      <IconButton icon={<Icon name="ellipsis" />} label="אפשרויות נוספות" />
    </div>
  );
}
