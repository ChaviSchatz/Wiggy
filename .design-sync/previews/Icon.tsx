import * as React from 'react';
import { Icon } from 'wiggy-design-system';

const NAMES = [
  'plus', 'search', 'chevron-left', 'chevron-right', 'check',
  'message-square', 'user', 'package', 'clock', 'paperclip', 'bell', 'ellipsis',
];

export function Glyphs() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
      {NAMES.map((n) => (
        <div key={n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: 64 }}>
          <Icon name={n} size={20} style={{ color: 'var(--ink)' }} />
          <span style={{ fontSize: 10, color: 'var(--faint)', fontFamily: 'ui-monospace, Menlo, monospace' }}>{n}</span>
        </div>
      ))}
    </div>
  );
}

export function Sizes() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <Icon name="package" size={14} style={{ color: 'var(--muted)' }} />
      <Icon name="package" size={16} style={{ color: 'var(--muted)' }} />
      <Icon name="package" size={18} style={{ color: 'var(--ink)' }} />
      <Icon name="package" size={20} style={{ color: 'var(--ink)' }} />
    </div>
  );
}
