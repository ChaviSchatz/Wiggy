import * as React from 'react';
import { WorkImage } from 'wiggy-design-system';

export function Gallery() {
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      <WorkImage
        src="https://images.unsplash.com/photo-1522336572468-97b06e8ef143?w=200&h=200&fit=crop"
        alt="תמונת התייחסות"
        size={72}
      />
      <WorkImage
        src="https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=200&h=200&fit=crop"
        alt="תמונת עבודה"
        size={72}
      />
    </div>
  );
}

export function DrawerHeader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <WorkImage
        src="https://images.unsplash.com/photo-1522336572468-97b06e8ef143?w=200&h=200&fit=crop"
        alt="תמונת התייחסות"
        size={56}
      />
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>WO-1041 · רבקה כהן</div>
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>פאה בעבודה · יעד 12.09.2026</div>
      </div>
    </div>
  );
}

export function NoSrc() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 12, color: 'var(--faint)' }}>הזמנה WO-1052 · ללא תמונת התייחסות —</span>
      <WorkImage src={null} alt="" size={56} />
    </div>
  );
}
