import * as React from "react";
export interface PageHeaderProps {
  title: React.ReactNode;
  /** Inline identity metadata beside the title — a record's phone and city. */
  titleMeta?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  backLink?: React.ReactNode;
  /** "compact" is the management/record header: 26px at 600, tighter below. */
  size?: "default" | "compact";
  style?: React.CSSProperties;
}
export function PageHeader(props: PageHeaderProps): JSX.Element;
