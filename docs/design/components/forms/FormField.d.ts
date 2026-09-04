export interface FormFieldProps {
  label?: React.ReactNode;
  htmlFor?: string;
  description?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
}
export function FormField(props: FormFieldProps): JSX.Element;
