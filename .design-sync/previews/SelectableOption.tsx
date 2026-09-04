import * as React from 'react';
import { SelectableOption } from 'wiggy-design-system';

const customers = [
  { id: 'c1', title: 'רבקה כהן', meta: '052-555-0148', description: 'בני ברק', trailing: '6 הזמנות' },
  { id: 'c2', title: 'מרים לוי', meta: '054-321-0099', description: 'תל אביב', trailing: '2 הזמנות' },
  { id: 'c3', title: 'שרה אברהם', meta: '050-777-4412', description: 'ירושלים', trailing: '11 הזמנות' },
];

export function SearchResults() {
  const [picked, setPicked] = React.useState('c1');
  return (
    <div role="listbox" style={{ display: 'grid', gap: 8 }}>
      {customers.map((c) => (
        <SelectableOption
          key={c.id}
          selected={c.id === picked}
          onSelect={() => setPicked(c.id)}
          title={c.title}
          meta={c.meta}
          description={c.description}
          trailing={c.trailing}
        />
      ))}
    </div>
  );
}

export function MultiSelectTemplates() {
  const [checked, setChecked] = React.useState<Record<string, boolean>>({ t2: true });
  const templates = [
    { id: 't1', title: 'תבנית פאה קלאסית', meta: '4 משימות', description: 'תספורת, החלקה, סטיילינג, בקרת איכות' },
    { id: 't2', title: 'תבנית תיקון קצוות', meta: '2 משימות', description: 'תיקון קצוות ובדיקת התאמה' },
  ];
  return (
    <div role="listbox" style={{ display: 'grid', gap: 8 }}>
      {templates.map((t) => (
        <SelectableOption
          key={t.id}
          indicator="check"
          selected={!!checked[t.id]}
          onSelect={() => setChecked((prev) => ({ ...prev, [t.id]: !prev[t.id] }))}
          title={t.title}
          meta={t.meta}
          description={t.description}
        />
      ))}
    </div>
  );
}
