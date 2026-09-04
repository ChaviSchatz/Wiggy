export interface ToggleProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: React.ReactNode;
  disabled?: boolean;
}
export function Toggle(props: ToggleProps): JSX.Element;
