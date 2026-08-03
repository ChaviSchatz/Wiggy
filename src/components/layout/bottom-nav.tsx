"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { bottomNavItems } from "./nav-items";

export function BottomNav() {
  const t = useTranslations("bottomNav");
  const pathname = usePathname();

  const itemClass = (active: boolean) =>
    cn(
      "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs font-medium transition-colors",
      active ? "text-mauve-600" : "text-muted hover:text-ink",
    );

  return (
    <nav
      aria-label={t("myWork")}
      className="fixed inset-x-0 bottom-0 z-20 flex border-t border-line bg-surface lg:hidden"
    >
      {bottomNavItems.map(({ key, href, icon: Icon }) => {
        const active = href ? pathname === href : false;
        const content = (
          <>
            <Icon className="size-5 shrink-0" aria-hidden />
            <span>{t(key)}</span>
          </>
        );

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
