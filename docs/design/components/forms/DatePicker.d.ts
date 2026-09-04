export interface DatePickerProps {
  /** ISO date string (yyyy-mm-dd). */
  value?: string;
  onChange?: (value: string) => void;
  invalid?: boolean;
}
export function DatePicker(props: DatePickerProps): JSX.Element;
