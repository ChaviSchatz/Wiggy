export interface RadioGroupProps {
  options: { value: string; label: string }[];
  value?: string;
  onChange?: (value: string) => void;
  name?: string;
}
export function RadioGroup(props: RadioGroupProps): JSX.Element;
