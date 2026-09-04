export interface SelectOption { value: string; label: string }
export interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  invalid?: boolean;
}
export function Select(props: SelectProps): JSX.Element;
