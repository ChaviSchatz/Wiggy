export interface FormMessageProps {
  tone?: "error" | "hint";
  children: React.ReactNode;
}
export function FormMessage(props: FormMessageProps): JSX.Element;
