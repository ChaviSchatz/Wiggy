export interface WordmarkProps {
  text?: string;
  subtitle?: string;
  /** Switches to sidebar-mark / sidebar-fg-dim for the dark nav. */
  onDark?: boolean;
  size?: number;
}
export function Wordmark(props: WordmarkProps): JSX.Element;
