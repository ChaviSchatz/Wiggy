import * as React from "react";
export interface SectionHeadingProps {
  title: React.ReactNode;
  /** Quiet count or context beside the title. */
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  /** "sm" is the form-group label form used inside dialogs. */
  size?: "default" | "sm";
  style?: React.CSSProperties;
}
export function SectionHeading(props: SectionHeadingProps): JSX.Element;
