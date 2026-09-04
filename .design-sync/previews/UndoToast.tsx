import * as React from 'react';
import { UndoToast } from 'wiggy-design-system';

export function TaskCompleted() {
  return <UndoToast open message="המשימה סומנה כהושלמה" onAction={() => {}} style={{ position: 'static', display: 'inline-flex' }} />;
}

export function OrderCancelled() {
  return (
    <UndoToast
      open
      message="הזמנה WO-1039 בוטלה"
      actionLabel="שחזור הזמנה"
      onAction={() => {}}
      style={{ position: 'static', display: 'inline-flex' }}
    />
  );
}
