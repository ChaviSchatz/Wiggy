import * as React from "react";
export interface SearchFieldProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  /** Override the default 260px cap when the surface is not a filter row. */
  style?: React.CSSProperties;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}
export function SearchField(props: SearchFieldProps): JSX.Element;
