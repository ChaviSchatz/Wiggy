/**
 * @startingPoint section="Data" subtitle="Flat dense list table" viewport="900x300"
 */
export interface DataTableColumn<T = any> {
  key: string;
  header: React.ReactNode;
  /** tabular-nums for anything compared. */
  numeric?: boolean;
  width?: number | string;
  render?: (row: T) => React.ReactNode;
}
export interface DataTableProps<T = any> {
  columns: DataTableColumn<T>[];
  rows: T[];
  onRowClick?: (row: T) => void;
  rowKey?: (row: T, index: number) => React.Key;
}
export function DataTable(props: DataTableProps): JSX.Element;
