import * as React from 'react';
import { AlertDialog } from 'wiggy-design-system';

// The wrapper needs its own transform + explicit height: AlertDialog (via
// Dialog) is `position:fixed; inset:0`, so it needs a sized containing block
// or the scrim collapses to auto-height's zero in a static capture harness.
export function CancelOrder() {
  return (
    <div style={{ position: 'relative', height: 260, transform: 'translateZ(0)', overflow: 'hidden', borderRadius: 12 }}>
      <AlertDialog
        open
        title="לבטל את ההזמנה?"
        description="המשימות שטרם הושלמו יבוטלו. לא ניתן לשחזר."
        confirmLabel="ביטול הזמנה"
        cancelLabel="חזרה"
        onConfirm={() => {}}
        onClose={() => {}}
      />
    </div>
  );
}

export function DeleteOrder() {
  return (
    <div style={{ position: 'relative', height: 260, transform: 'translateZ(0)', overflow: 'hidden', borderRadius: 12 }}>
      <AlertDialog
        open
        title="למחוק את הזמנה WO-1041?"
        description="כל הנתונים, כולל תמונות ייחוס והיסטוריית עבודה, יימחקו לצמיתות."
        confirmLabel="מחיקה"
        cancelLabel="ביטול"
        onConfirm={() => {}}
        onClose={() => {}}
      />
    </div>
  );
}
