import * as React from "react";
export interface InlineAlertProps {
  /** Meaning, mapped to the status triplet. */
  tone?: "danger" | "peach" | "sage" | "info" | "mauve";
  title?: React.ReactNode;
  children?: React.ReactNode;
  /** One quiet action — usually a ghost Button. */
  action?: React.ReactNode;
  /** Override the tone's default lucide icon. */
  icon?: string;
  style?: React.CSSProperties;
}
export function InlineAlert(props: InlineAlertProps): JSX.Element;
