import * as React from 'react';
import { Tooltip, IconButton, Icon } from 'wiggy-design-system';

// Tooltip only exposes show/hide via hover + focus (no `open` prop). autoFocus on the
// trigger fires a real focus event that bubbles to Tooltip's onFocus handler, so this
// renders the actual open state through the component's real API rather than a fake.
export function AttachFile() {
  return (
    <div style={{ paddingTop: 30 }}>
      <Tooltip label="הוספת קובץ">
        <IconButton icon={<Icon name="paperclip" size={16} />} label="הוספת קובץ" autoFocus style={{ outline: 'none' }} />
      </Tooltip>
    </div>
  );
}

export function DeleteAction() {
  return (
    <div style={{ paddingTop: 30 }}>
      <Tooltip label="מחיקת הזמנה">
        <IconButton icon={<Icon name="trash-2" size={16} />} label="מחיקת הזמנה" autoFocus style={{ outline: 'none' }} />
      </Tooltip>
    </div>
  );
}
