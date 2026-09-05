"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useTranslations } from "next-intl";

import { Avatar } from "@/components/ui/avatar";
import type { CurrentUser } from "@/lib/auth/types";
import type { Role } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { visibleSideNavItems } from "./nav-items";

const COLLAPSED_STORAGE_KEY = "wiggy.sideNavCollapsed";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * The one inverted surface in the product (design-language.md): a dark plum
 * panel that carries the brand at the top and the current user at the bottom.
 * Desktop only -- below `lg` navigation moves to `BottomNav`.
 *
 * Collapsible to a slim icon rail: a per-viewer preference (`localStorage`,
 * not synced anywhere), mainly for wide surfaces like the production board
 * that want the extra column width. Starts expanded on every load -- the
 * collapsed read only happens after mount, so server and client agree on
 * the first paint and there's nothing to flash.
 */
export function SideNav({ user, role }: { user: CurrentUser; role: Role }) {
  const t = useTranslations("nav");
  const tApp = useTranslations("app");
  const tRoles = useTranslations("roles");
  const tA11y = useTranslations("a11y");
  const pathname = usePathname();

  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSED_STORAGE_KEY) === "true");
    } catch {
      // Private-browsing / storage-blocked: stay expanded.
    }
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSED_STORAGE_KEY, String(next));
      } catch {
        // Nothing to persist to -- the toggle still works for this session.
      }
      return next;
    });
  }

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col bg-sidebar transition-[width] duration-200 lg:flex",
        collapsed ? "w-16" : "w-[228px]",
      )}
    >
      <div
        className={cn(
          "flex items-center border-b border-sidebar-line py-4",
          collapsed ? "justify-center px-2" : "gap-2.5 px-4",
        )}
      >
        {!collapsed ? (
          <>
            <span
              className="flex size-8 shrink-0 items-center justify-center rounded-xs border border-sidebar-mark font-display text-body-lg text-sidebar-mark"
              aria-hidden
            >
              {tApp("name").charAt(0)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-display text-body font-semibold text-sidebar-fg">
                {tApp("name")}
              </span>
              <span className="block truncate text-meta text-sidebar-fg-dim">
                {user.businessName}
              </span>
            </span>
          </>
        ) : null}
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={
            collapsed ? tA11y("expandSideNav") : tA11y("collapseSideNav")
          }
          title={collapsed ? tA11y("expandSideNav") : tA11y("collapseSideNav")}
          className="flex size-8 shrink-0 items-center justify-center rounded-control text-sidebar-fg-dim transition-colors hover:bg-sidebar-hover hover:text-sidebar-fg"
        >
          {collapsed ? (
            <PanelLeftOpen className="size-[18px]" aria-hidden />
          ) : (
            <PanelLeftClose className="size-[18px]" aria-hidden />
          )}
        </button>
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
              title={collapsed ? t(key) : undefined}
              className={cn(
                "flex h-[47px] items-center gap-3 rounded-control text-body font-medium transition-colors",
                collapsed ? "justify-center px-0" : "px-3",
                active
                  ? "bg-sidebar-active text-white"
                  : "text-sidebar-fg hover:bg-sidebar-hover",
              )}
            >
              <Icon className="size-5 shrink-0" aria-hidden />
              {!collapsed ? <span className="truncate">{t(key)}</span> : null}
            </Link>
          );
        })}
      </nav>

      <div
        className={cn(
          "flex items-center border-t border-sidebar-line py-3",
          collapsed ? "justify-center px-2" : "gap-2.5 px-4",
        )}
      >
        <Avatar name={user.fullName} size="sm" />
        {!collapsed ? (
          <span className="min-w-0">
            <span className="block truncate text-body font-medium text-sidebar-fg">
              {user.fullName ?? user.email}
            </span>
            <span className="block truncate text-meta text-sidebar-fg-dim">
              {tRoles(role)}
            </span>
          </span>
        ) : null}
      </div>
    </aside>
  );
}
