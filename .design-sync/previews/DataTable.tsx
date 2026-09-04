import * as React from 'react';
import { DataTable, StatusChip } from 'wiggy-design-system';

const rows = [
  { code: 'WO-1041', name: 'רבקה כהן', status: 'active', label: 'פעיל', due: '12.09.2026', tasks: '8 / 11' },
  { code: 'WO-1039', name: 'מרים לוי', status: 'awaiting_approval', label: 'ממתין לאישור', due: '09.09.2026', tasks: '11 / 11' },
  { code: 'WO-1028', name: 'פאה לתצוגה', status: 'late', label: 'באיחור', due: '01.09.2026', tasks: '3 / 14' },
];

const columns = [
  { key: 'name', header: 'לקוחה', render: (r: any) => <span style={{ fontWeight: 700 }}>{r.name}</span> },
  { key: 'code', header: 'קוד', numeric: true },
  { key: 'status', header: 'סטטוס', render: (r: any) => <StatusChip status={r.status}>{r.label}</StatusChip> },
  { key: 'due', header: 'יעד', numeric: true },
  { key: 'tasks', header: 'משימות', numeric: true },
];

export function Default() {
  return <DataTable columns={columns} rows={rows} rowKey={(r: any) => r.code} />;
}
