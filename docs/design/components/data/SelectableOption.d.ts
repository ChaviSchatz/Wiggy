import * as React from "react";
export interface SelectableOptionProps {
  selected?: boolean;
  onSelect?: () => void;
  title: React.ReactNode;
  /** Quiet metadata on the identity line — a phone number, a task count. */
  meta?: React.ReactNode;
  description?: React.ReactNode;
  /** End-aligned secondary value. */
  trailing?: React.ReactNode;
  /** "radio" for one-of; "check" for many-of. */
  indicator?: "radio" | "check";
  disabled?: boolean;
  style?: React.CSSProperties;
}
export function SelectableOption(props: SelectableOptionProps): JSX.Element;
