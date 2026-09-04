import * as React from 'react';
import { Input } from 'wiggy-design-system';

export function Default() {
  return (
    <div style={{ maxWidth: 260 }}>
      <Input placeholder="שם מלא" />
    </div>
  );
}

export function WithValue() {
  return (
    <div style={{ maxWidth: 260 }}>
      <Input defaultValue="רבקה כהן" />
    </div>
  );
}

export function Invalid() {
  return (
    <div style={{ maxWidth: 260 }}>
      <Input defaultValue="rivka@" invalid />
    </div>
  );
}

export function Disabled() {
  return (
    <div style={{ maxWidth: 260 }}>
      <Input defaultValue="WO-1041" disabled />
    </div>
  );
}
