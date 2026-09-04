import * as React from 'react';
import { FormField, Input, Select, Combobox, Textarea } from 'wiggy-design-system';

const stages = [
  { value: 'intake', label: 'קליטה' },
  { value: 'sewing', label: 'תפירה' },
  { value: 'finish', label: 'גימור' },
];

const customers = [
  { value: '1', label: 'רבקה כהן', meta: 'WO-1041' },
  { value: '2', label: 'מרים לוי', meta: 'WO-1039' },
];

export function Required() {
  return (
    <div style={{ maxWidth: 260 }}>
      <FormField label="שם הלקוחה" required>
        <Input placeholder="שם מלא" />
      </FormField>
    </div>
  );
}

export function WithError() {
  return (
    <div style={{ maxWidth: 260 }}>
      <FormField label="דוא״ל" error="כתובת הדוא״ל אינה תקינה">
        <Input defaultValue="rivka@" invalid />
      </FormField>
    </div>
  );
}

export function WithDescription() {
  return (
    <div style={{ maxWidth: 260 }}>
      <FormField label="שלב עבודה" description="נקבע אוטומטית לפי לוח הזמנים">
        <Select options={stages} value="sewing" />
      </FormField>
    </div>
  );
}

export function ComboboxField() {
  return (
    <div style={{ maxWidth: 260 }}>
      <FormField label="לקוחה" description="חיפוש בקטלוג">
        <Combobox options={customers} value="1" />
      </FormField>
    </div>
  );
}

export function Notes() {
  return (
    <div style={{ maxWidth: 320 }}>
      <FormField label="הערות">
        <Textarea rows={3} placeholder="הערות לצוות" />
      </FormField>
    </div>
  );
}
