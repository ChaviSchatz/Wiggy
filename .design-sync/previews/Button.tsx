import * as React from 'react';
import { Button, Icon } from 'wiggy-design-system';

export function Variants() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
      <Button variant="primary" iconStart={<Icon name="plus" size={16} />}>
        הזמנה חדשה
      </Button>
      <Button variant="outline">ביטול</Button>
      <Button variant="soft">סינון</Button>
      <Button variant="ghost">פתיחה</Button>
      <Button variant="danger-soft">ביטול הזמנה</Button>
      <Button variant="danger">מחיקה</Button>
      <Button variant="link">קישור</Button>
    </div>
  );
}

export function Sizes() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
      <Button size="sm" variant="outline">
        sm
      </Button>
      <Button size="default" variant="outline">
        default
      </Button>
      <Button size="primary">primary</Button>
      <Button size="lg" variant="outline">
        lg
      </Button>
      <Button size="icon" variant="ghost" iconStart={<Icon name="ellipsis" size={16} />} />
    </div>
  );
}

export function States() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
      <Button disabled>לא זמין</Button>
      <Button variant="outline" disabled>
        לא זמין
      </Button>
      <Button variant="primary" iconStart={<Icon name="check" size={16} />}>
        שמירה
      </Button>
    </div>
  );
}
