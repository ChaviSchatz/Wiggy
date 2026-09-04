export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Adds the hover treatment: border → line-strong plus a 1px lift. Never a shadow. */
  interactive?: boolean;
  children?: React.ReactNode;
}
export function Card(props: CardProps): JSX.Element;
