export interface ComboboxOption { value: string; label: string; meta?: string }
export interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  emptyLabel?: string;
}
export function Combobox(props: ComboboxProps): JSX.Element;
