export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  /** Required — becomes aria-label and title. */
  label: string;
}
export function IconButton(props: IconButtonProps): JSX.Element;
