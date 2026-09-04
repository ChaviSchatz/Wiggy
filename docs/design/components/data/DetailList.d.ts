import * as React from "react";
export interface DetailListItem {
  label: React.ReactNode;
  value?: React.ReactNode;
  /** Tabular numerals — phones, dates, counts, codes. */
  numeric?: boolean;
}
export interface DetailListProps {
  items: DetailListItem[];
  /** 1 on narrow columns and tablet, 2 on a desktop detail surface. */
  columns?: number;
  style?: React.CSSProperties;
}
export function DetailList(props: DetailListProps): JSX.Element;
