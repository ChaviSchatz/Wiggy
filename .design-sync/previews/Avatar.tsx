import * as React from 'react';
import { Avatar } from 'wiggy-design-system';

export function Sizes() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <Avatar name="שירה לוי" size="xs" />
      <Avatar name="פראדי כהן" size="sm" />
      <Avatar name="מיכל אברהם" size="md" />
      <Avatar name="רבקה כהן" size="lg" />
    </div>
  );
}

export function WithPhoto() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <Avatar name="שירה לוי" size="lg" src="https://i.pravatar.cc/88?img=47" />
      <Avatar name="דנה מזרחי" size="lg" />
    </div>
  );
}

export function AssigneeRow() {
  const staff = [
    { name: 'שירה לוי', role: 'מעצבת פאות' },
    { name: 'פראדי כהן', role: 'טכנאי' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: 220 }}>
      {staff.map((p) => (
        <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar name={p.name} size="md" onClick={() => {}} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{p.name}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>{p.role}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
