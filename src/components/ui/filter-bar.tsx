import { cn } from "@/lib/utils";

export interface FilterBarTab {
  id: string;
  label: string;
  count?: number;
}

export interface FilterBarProps {
  tabs?: FilterBarTab[];
  activeTab?: string;
  onTabChange?: (id: string) => void;
  /** The search input — a self-contained control (e.g. a debounced search bar), not owned by FilterBar. */
  search?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

/**
 * One shared search + filter row for every list and board (design-system.md
 * "data" group). Tabs are editorial: muted text, no ground, a fine plum
 * underline on the active one — never pills.
 */
export function FilterBar({ tabs, activeTab, onTabChange, search, actions, className }: FilterBarProps) {
  return (
    <div className={cn("mb-4 grid gap-3", className)}>
      {tabs && tabs.length > 0 && (
        <div className="flex items-stretch gap-0 overflow-x-auto border-b border-line">
          {tabs.map((tab) => {
            const active = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange?.(tab.id)}
                className={cn(
                  "-mb-px inline-flex items-baseline gap-1 whitespace-nowrap border-b-2 px-2.5 pb-2 text-meta transition-colors",
                  active
                    ? "border-mauve-600 font-semibold text-mauve-600"
                    : "border-transparent font-normal text-muted hover:text-ink",
                )}
              >
                {tab.label}
                {tab.count != null && (
                  <span className="text-meta tabular-nums text-faint">{tab.count}</span>
                )}
              </button>
            );
          })}
        </div>
      )}
      {(search || actions) && (
        <div className="flex flex-wrap items-center gap-2">
          {search}
          {actions}
        </div>
      )}
    </div>
  );
}
