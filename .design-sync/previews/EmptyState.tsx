import * as React from 'react';
import { EmptyState, Button, Icon } from 'wiggy-design-system';

export function NoActiveOrders() {
  return (
    <EmptyState
      icon="package"
      title="אין הזמנות פעילות"
      description="כל ההזמנות נמסרו."
      action={<Button variant="primary" iconStart={<Icon name="plus" size={16} />}>הזמנה חדשה</Button>}
    />
  );
}

export function NoSearchResults() {
  return (
    <EmptyState
      icon="search"
      title="לא נמצאו תוצאות"
      description="נסי מונח חיפוש אחר או נקי את הסינון."
      action={<Button variant="outline">איפוס סינון</Button>}
    />
  );
}
