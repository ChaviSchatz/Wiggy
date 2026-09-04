import * as React from 'react';
import { Stepper } from 'wiggy-design-system';

export function OrderProgress() {
  return (
    <div style={{ maxWidth: 380 }}>
      <Stepper steps={['קליטה', 'תפירה', 'גימור', 'מסירה']} current={1} />
    </div>
  );
}

export function NearDelivery() {
  return (
    <div style={{ maxWidth: 380 }}>
      <Stepper steps={['קליטה', 'תפירה', 'גימור', 'מסירה']} current={3} />
    </div>
  );
}
