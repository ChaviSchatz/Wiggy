import * as React from 'react';
import { RadioGroup } from 'wiggy-design-system';

const urgencyOptions = [
  { value: 'urgent', label: 'דחוף' },
  { value: 'due_soon', label: 'מתקרב ליעד' },
  { value: 'normal', label: 'רגיל' },
];

const paymentOptions = [
  { value: 'cash', label: 'מזומן' },
  { value: 'credit', label: 'אשראי' },
  { value: 'transfer', label: 'העברה בנקאית' },
];

export function Urgency() {
  return (
    <div style={{ maxWidth: 260 }}>
      <RadioGroup name="urgency" options={urgencyOptions} value="urgent" />
    </div>
  );
}

export function PaymentMethod() {
  return (
    <div style={{ maxWidth: 260 }}>
      <RadioGroup name="payment" options={paymentOptions} value="credit" />
    </div>
  );
}
