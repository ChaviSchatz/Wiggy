export interface AvatarProps {
  /** Worker name — drives the monogram and its deterministic calm colour. */
  name: string;
  src?: string;
  /** sm 28 · md 34 · lg 44 (tablet / reassign target). */
  size?: "sm" | "md" | "lg";
  /** On a board card, tapping the avatar reassigns the task. */
  onClick?: () => void;
}
export function Avatar(props: AvatarProps): JSX.Element;
