import * as React from 'react';
import { Select } from 'wiggy-design-system';

const stages = [
  { value: 'intake', label: 'קליטה' },
  { value: 'sewing', label: 'תפירה' },
  { value: 'finish', label: 'גימור' },
];

export function WithValue() {
  return (
    <div style={{ maxWidth: 220 }}>
      <Select options={stages} value="sewing" />
    </div>
  );
}

export function Placeholder() {
  return (
    <div style={{ maxWidth: 220 }}>
      <Select options={stages} placeholder="בחרי שלב" />
    </div>
  );
}

export function Invalid() {
  return (
    <div style={{ maxWidth: 220 }}>
      <Select options={stages} invalid />
    </div>
  );
}
