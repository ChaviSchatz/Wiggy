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
      } catch {}
      return next;
    });
  }

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col bg-sidebar transition-[width] duration-200 lg:flex",
        collapsed ? "w-14" : "w-[220px]",
      )}
    >
      {/* Brand / header */}
      <div
        className={cn(
          "flex items-center border-b border-sidebar-line",
          collapsed ? "h-[52px] justify-center px-2" : "h-[52px] gap-2.5 px-3",
        )}
      >
        {!collapsed ? (
          <>
            <span
              className="flex size-7 shrink-0 items-center justify-center rounded-md border border-sidebar-mark/60 font-display text-[13px] font-bold text-sidebar-mark"
              aria-hidden
            >
              {tApp("name").charAt(0)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-bold leading-tight text-sidebar-fg">
                {tApp("name")}
              </span>
              <span className="block truncate text-[11px] leading-tight text-sidebar-fg-dim">
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
          className="flex size-7 shrink-0 items-center justify-center rounded-md text-sidebar-fg-dim transition-colors duration-75 hover:bg-sidebar-hover hover:text-sidebar-fg"
        >
          {collapsed ? (
            <PanelLeftOpen className="size-4" aria-hidden />
          ) : (
            <PanelLeftClose className="size-4" aria-hidden />
          )}
        </button>
      </div>

      {/* Nav items */}
      <nav
        aria-label={tA11y("primaryNav")}
        className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-2"
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
                "group relative flex h-10 items-center rounded-md text-[13px] font-medium transition-colors duration-75",
                collapsed ? "justify-center px-0" : "gap-2.5 px-2.5",
                active
                  ? "bg-sidebar-active text-white"
                  : "text-sidebar-fg-dim hover:bg-sidebar-hover hover:text-sidebar-fg",
              )}
            >
              {/* Active indicator stripe */}
              {active && !collapsed ? (
                <span
                  className="absolute inset-y-2 start-0 w-[3px] rounded-full bg-white/50"
                  aria-hidden
                />
              ) : null}

              <Icon
                className={cn(
                  "shrink-0 transition-none",
                  collapsed ? "size-[18px]" : "size-4",
                  active ? "text-white" : "text-sidebar-fg-dim group-hover:text-sidebar-fg",
                )}
                aria-hidden
              />
              {!collapsed ? (
                <span className="truncate">{t(key)}</span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div
        className={cn(
          "flex items-center border-t border-sidebar-line",
          collapsed
            ? "h-[52px] justify-center px-2"
            : "h-[52px] gap-2.5 px-3",
        )}
      >
        <Avatar name={user.fullName} size="sm" className="shrink-0" />
        {!collapsed ? (
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-medium leading-tight text-sidebar-fg">
              {user.fullName ?? user.email}
            </span>
            <span className="block truncate text-[11px] leading-tight text-sidebar-fg-dim">
              {tRoles(role)}
            </span>
          </span>
        ) : null}
      </div>
    </aside>
  );
}
