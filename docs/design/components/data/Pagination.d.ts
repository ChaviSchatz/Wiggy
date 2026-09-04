export interface PaginationProps {
  page?: number;
  pageCount?: number;
  onPageChange?: (page: number) => void;
  /** e.g. "128 הזמנות" — rendered at the inline start. */
  totalLabel?: string;
}
export function Pagination(props: PaginationProps): JSX.Element;
