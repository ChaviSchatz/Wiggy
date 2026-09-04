import * as React from 'react';
import { PrimaryActionBar, Button } from 'wiggy-design-system';

export function DetailFooter() {
  return (
    <PrimaryActionBar
      sticky
      primary={<Button>סימון כנמסר</Button>}
      secondary={<Button variant="outline">עריכת קליטה</Button>}
      destructive={<Button variant="danger-soft">ביטול הזמנה</Button>}
    />
  );
}

export function WizardFooter() {
  return (
    <PrimaryActionBar
      sticky
      primary={<Button>המשך</Button>}
      secondary={<Button variant="outline">חזרה</Button>}
      destructive={<Button variant="danger-soft">ביטול</Button>}
    />
  );
}
