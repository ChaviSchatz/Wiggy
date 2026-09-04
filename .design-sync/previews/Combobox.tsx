import * as React from 'react';
import { Combobox } from 'wiggy-design-system';

const customers = [
  { value: '1', label: 'רבקה כהן', meta: 'WO-1041' },
  { value: '2', label: 'מרים לוי', meta: 'WO-1039' },
  { value: '3', label: 'שרה אברהם', meta: 'WO-1028' },
];

export function Empty() {
  return (
    <div style={{ maxWidth: 280 }}>
      <Combobox options={customers} placeholder="חיפוש לקוחה" />
    </div>
  );
}

export function WithValue() {
  return (
    <div style={{ maxWidth: 280 }}>
      <Combobox options={customers} value="1" />
    </div>
  );
}
