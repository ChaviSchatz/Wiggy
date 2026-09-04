import * as React from 'react';
import { PageHeader, BackLink, Button, IconButton, Icon } from 'wiggy-design-system';

export function Default() {
  return (
    <PageHeader
      title="לוח ייצור"
      subtitle="24 משימות פעילות"
      actions={<Button variant="soft">סינון</Button>}
    />
  );
}

export function Compact() {
  return (
    <PageHeader
      size="compact"
      title="רבקה כהן"
      titleMeta="050-1234567 · תל אביב"
      subtitle="לקוחה מזה 3 שנים"
    />
  );
}

export function WithBackLinkAndActions() {
  return (
    <PageHeader
      backLink={<BackLink label="חזרה להזמנות" onClick={() => {}} />}
      title="הזמנה WO-1041"
      titleMeta="רבקה כהן"
      subtitle="יעד 12.09.2026"
      actions={
        <>
          <Button variant="outline">עריכה</Button>
          <IconButton icon={<Icon name="message-square" />} label="משוב" />
        </>
      }
    />
  );
}
