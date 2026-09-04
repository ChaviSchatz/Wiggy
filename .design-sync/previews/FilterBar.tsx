import * as React from 'react';
import { FilterBar, Button, Icon } from 'wiggy-design-system';

const tabs = [
  { id: 'all', label: 'הכול', count: 128 },
  { id: 'active', label: 'פעיל', count: 24 },
  { id: 'late', label: 'באיחור', count: 3 },
  { id: 'delivered', label: 'נמסר', count: 96 },
];

export function Default() {
  const [tab, setTab] = React.useState('active');
  const [q, setQ] = React.useState('');
  return (
    <FilterBar
      tabs={tabs}
      activeTab={tab}
      onTabChange={setTab}
      search={q}
      onSearchChange={setQ}
      searchPlaceholder="חיפוש לקוחה או קוד"
    />
  );
}

export function WithActions() {
  const [tab, setTab] = React.useState('all');
  const [q, setQ] = React.useState('רבקה');
  return (
    <FilterBar
      tabs={tabs}
      activeTab={tab}
      onTabChange={setTab}
      search={q}
      onSearchChange={setQ}
      searchPlaceholder="חיפוש לקוחה או קוד"
      actions={<Button variant="soft" iconStart={<Icon name="sliders-horizontal" size={16} />}>סינון מתקדם</Button>}
    />
  );
}
