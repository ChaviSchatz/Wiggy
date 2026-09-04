export interface FilterBarProps {
  tabs?: { id: string; label: string; count?: number }[];
  activeTab?: string;
  onTabChange?: (id: string) => void;
  search?: string;
  /** Omit to hide the search field. Debounce in the caller. */
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  actions?: React.ReactNode;
}
export function FilterBar(props: FilterBarProps): JSX.Element;
