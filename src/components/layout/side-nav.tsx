"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { Avatar } from "@/components/ui/avatar";
import type { CurrentUser } from "@/lib/auth/types";
import type { Role } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { visibleSideNavItems } from "./nav-items";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * The one inverted surface in the product (design-language.md): a dark plum
 * panel that carries the brand at the top and the current user at the bottom.
 * Desktop only -- below `lg` navigation moves to `BottomNav`.
 */
export function SideNav({ user, role }: { user: CurrentUser; role: Role }) {
  const t = useTranslations("nav");
  const tApp = useTranslations("app");
  const tRoles = useTranslations("roles");
  const tA11y = useTranslations("a11y");
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-[228px] shrink-0 flex-col bg-sidebar lg:flex">
      <div className="flex items-center gap-2.5 border-b border-sidebar-line px-4 py-4">
        <span
          className="flex size-8 shrink-0 items-center justify-center rounded-xs border border-sidebar-mark font-display text-body-lg text-sidebar-mark"
          aria-hidden
        >
          {tApp("name").charAt(0)}
        </span>
        <span className="min-w-0">
          <span className="block truncate font-display text-body font-semibold text-sidebar-fg">
            {user.businessName}
          </span>
          <span className="block truncate text-meta text-sidebar-fg-dim">
            {tApp("name")}
          </span>
        </span>
      </div>

      <nav
        aria-label={tA11y("primaryNav")}
        className="flex flex-1 flex-col gap-1 overflow-y-auto p-3"
      >
        {visibleSideNavItems(role).map(({ key, href, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={key}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-[47px] items-center gap-3 rounded-control px-3 text-body font-medium transition-colors",
                active
                  ? "bg-sidebar-active text-white"
                  : "text-sidebar-fg hover:bg-sidebar-hover",
              )}
            >
              <Icon className="size-5 shrink-0" aria-hidden />
              <span className="truncate">{t(key)}</span>
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-2.5 border-t border-sidebar-line px-4 py-3">
        <Avatar name={user.fullName} size="sm" />
        <span className="min-w-0">
          <span className="block truncate text-body font-medium text-sidebar-fg">
            {user.fullName ?? user.email}
          </span>
          <span className="block truncate text-meta text-sidebar-fg-dim">
            {tRoles(role)}
          </span>
        </span>
      </div>
    </aside>
  );
}
