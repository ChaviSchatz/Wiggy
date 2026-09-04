import * as React from 'react';
import { FormMessage } from 'wiggy-design-system';

export function Error() {
  return <FormMessage>כתובת הדוא״ל אינה תקינה</FormMessage>;
}

export function Hint() {
  return <FormMessage tone="hint">נשמר אוטומטית</FormMessage>;
}
