import * as React from 'react';
import { Dialog, Button, FormField, Input } from 'wiggy-design-system';

// The wrapper needs its own transform + explicit height: Dialog's root is
// `position:fixed; inset:0`, so it needs a sized containing block or the
// scrim collapses to auto-height's zero in a static capture harness.
export function MissingItemForm() {
  return (
    <div style={{ position: 'relative', height: 420, transform: 'translateZ(0)', overflow: 'hidden', borderRadius: 12 }}>
      <Dialog
        open
        onClose={() => {}}
        title="טיפול בפריט חסר"
        description="הפריט יסומן כהוזמן ותיווסף רשומה להיסטוריה."
        width={380}
        footer={
          <>
            <Button variant="primary">שמירה</Button>
            <Button variant="outline">ביטול</Button>
          </>
        }
      >
        <FormField label="ספק">
          <Input placeholder="שם הספק" defaultValue="פאות ניר בע״מ" />
        </FormField>
      </Dialog>
    </div>
  );
}
