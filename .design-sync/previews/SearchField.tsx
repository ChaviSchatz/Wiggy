import * as React from 'react';
import { SearchField } from 'wiggy-design-system';

export function Default() {
  const [value, setValue] = React.useState('');
  return <SearchField value={value} onChange={setValue} placeholder="חיפוש הזמנה או לקוחה…" />;
}

export function Filled() {
  const [value, setValue] = React.useState('רבקה כהן');
  return <SearchField value={value} onChange={setValue} />;
}
