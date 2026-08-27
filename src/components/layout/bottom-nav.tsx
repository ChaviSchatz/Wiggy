"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { FeedbackDialog } from "@/components/feedback/feedback-dialog";
import type { Role } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { visibleBottomNavItems } from "./nav-items";

export function BottomNav({ role }: { role: Role }) {
  const t = useTranslations("bottomNav");
  const tA11y = useTranslations("a11y");
  const pathname = usePathname();
  const items = visibleBottomNavItems(role);

  // >=44px touch target (design-system.md §3) -- this bar is the tablet and
  // phone navigation, so the target floor applies to every entry.
  const itemClass = (active: boolean) =>
    cn(
      "flex min-h-[44px] flex-1 flex-col items-center justify-center gap-1 py-2 text-meta font-medium transition-colors",
      active ? "bg-mauve-100 text-mauve-600" : "text-muted hover:text-ink",
    );

  return (
    <nav
      aria-label={tA11y("secondaryNav")}
      className="fixed inset-x-0 bottom-0 z-bottom flex border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      {items.map(({ key, href, icon: Icon }) => {
        const active = href ? pathname === href : false;
        const content = (
          <>
            <Icon className="size-5 shrink-0" aria-hidden />
            <span>{t(key)}</span>
          </>
        );

        if (key === "feedback") {
          return (
            <FeedbackDialog
              key={key}
              trigger={
                <button type="button" className={itemClass(false)}>
                  {content}
                </button>
              }
            />
          );
        }

        if (!href) {
          return (
            <button key={key} type="button" className={itemClass(false)}>
              {content}
            </button>
          );
        }

        return (
          <Link
            key={key}
            href={href}
            aria-current={active ? "page" : undefined}
            className={itemClass(active)}
          >
            {content}
          </Link>
        );
      })}
    </nav>
  );
}
