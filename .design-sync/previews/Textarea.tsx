import * as React from 'react';
import { Textarea } from 'wiggy-design-system';

export function Default() {
  return (
    <div style={{ maxWidth: 320 }}>
      <Textarea rows={3} placeholder="הערות לצוות" />
    </div>
  );
}

export function WithValue() {
  return (
    <div style={{ maxWidth: 320 }}>
      <Textarea rows={4} defaultValue={'להשלים גימור עד יום חמישי.\nללקוחה יש אירוע בסוף השבוע.'} />
    </div>
  );
}

export function Invalid() {
  return (
    <div style={{ maxWidth: 320 }}>
      <Textarea rows={3} invalid defaultValue="חסר מידע על מידות" />
    </div>
  );
}
