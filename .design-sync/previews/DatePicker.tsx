import * as React from 'react';
import { DatePicker } from 'wiggy-design-system';

export function WithValue() {
  return (
    <div style={{ maxWidth: 220 }}>
      <DatePicker value="2026-09-12" />
    </div>
  );
}

export function Empty() {
  return (
    <div style={{ maxWidth: 220 }}>
      <DatePicker />
    </div>
  );
}

export function Invalid() {
  return (
    <div style={{ maxWidth: 220 }}>
      <DatePicker invalid />
    </div>
  );
}
