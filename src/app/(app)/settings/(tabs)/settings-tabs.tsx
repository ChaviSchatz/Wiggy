"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

/**
 * Page-level section nav (not a FilterBar -- these switch the whole visible
 * settings section, each a real route, not a data filter). Underline tabs,
 * same accent language as the rest of the app, but sized for navigation
 * rather than filtering.
 */
export function SettingsTabs({
  tabs,
}: {
  tabs: { key: string; href: string; label: string }[];
}) {
  const pathname = usePathname();

  return (
    <div
      role="tablist"
      className="mb-6 flex flex-wrap items-center gap-6 border-b border-line"
    >
      {tabs.map((tab) => {
        const active =
          pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.key}
            href={tab.href}
            role="tab"
            aria-selected={active}
            className={cn(
              "-mb-px border-b-2 pb-3 text-section transition-colors",
              active
                ? "border-mauve-600 text-mauve-600"
                : "border-transparent text-muted hover:text-ink",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
