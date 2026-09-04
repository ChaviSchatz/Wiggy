export interface AudioPlayerProps {
  src?: string;
  /** e.g. "0:42" — tabular. */
  durationLabel?: string;
  title?: string;
}
export function AudioPlayer(props: AudioPlayerProps): JSX.Element;
