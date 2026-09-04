export interface SkeletonProps {
  height?: number | string;
  width?: number | string;
  radius?: string;
  /** >1 renders stacked bars with a shorter last line. */
  lines?: number;
}
export function Skeleton(props: SkeletonProps): JSX.Element;
