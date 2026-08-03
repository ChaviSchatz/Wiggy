"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import type { Role } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { visibleSideNavItems } from "./nav-items";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SideNav({ role }: { role: Role }) {
  const t = useTranslations("nav");
  const tA11y = useTranslations("a11y");
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-s border-line bg-surface lg:block">
      <nav
        aria-label={tA11y("primaryNav")}
        className="sticky top-16 flex flex-col gap-1 p-3"
      >
        {visibleSideNavItems(role).map(({ key, href, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={key}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-control px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-mauve-100 text-mauve-600"
                  : "text-ink hover:bg-mauve-100",
              )}
            >
              <Icon className="size-5 shrink-0" aria-hidden />
              <span>{t(key)}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
