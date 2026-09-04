import * as React from 'react';
import { ImageSlot } from 'wiggy-design-system';

export function Default() {
  return <ImageSlot label="תמונת התייחסות" size={72} />;
}

export function Sizes() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
      <ImageSlot label="רפרנס" size={44} />
      <ImageSlot label="תמונת עבודה" size={56} />
      <ImageSlot label="לפני ואחרי" size={72} />
    </div>
  );
}
