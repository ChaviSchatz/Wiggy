export interface WorkImageProps {
  /** Falsy src renders nothing at all — that is the contract. */
  src?: string | null;
  alt?: string;
  size?: number;
}
export function WorkImage(props: WorkImageProps): JSX.Element | null;
