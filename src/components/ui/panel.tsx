import * as React from "react";

import { cn } from "@/lib/utils";

export interface PanelProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  /** The 2px plum tick at the leading edge of the header. On by default (design-language.md). */
  tick?: boolean;
  bodyClassName?: string;
}

/**
 * A section container with its own header (design-system.md §3, Archetype
 * building block) — softer radius than `Card`, since panels/sheets/modals
 * get the bigger end of the radius scale while resting cards stay tighter.
 */
const Panel = React.forwardRef<HTMLDivElement, PanelProps>(
  (
    { title, subtitle, actions, tick = true, bodyClassName, className, children, ...props },
    ref,
  ) => (
    <section
      ref={ref}
      className={cn("overflow-hidden rounded-md border border-line bg-surface", className)}
      {...props}
    >
      {(title || actions) && (
        <header className="flex items-center gap-2.5 border-b border-line px-4 py-3">
          {tick && (
            <span className="h-[18px] w-0.5 flex-none rounded-full bg-hairline" aria-hidden="true" />
          )}
          <div className="min-w-0">
            {title && <h2 className="font-display text-section text-ink">{title}</h2>}
            {subtitle && <p className="text-meta text-muted">{subtitle}</p>}
          </div>
          {actions && <div className="ms-auto flex gap-2">{actions}</div>}
        </header>
      )}
      <div className={cn("p-4", bodyClassName)}>{children}</div>
    </section>
  ),
);
Panel.displayName = "Panel";

export { Panel };
