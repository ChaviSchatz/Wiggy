"use client";

import Link from "next/link";
import { ChevronDown, LogOut, MessageSquare, Plus, UserCircle } from "lucide-react";
import { useTranslations } from "next-intl";

import { FeedbackDialog } from "@/components/feedback/feedback-dialog";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { menuItemClass } from "@/components/ui/menu-item";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { signOutAction } from "@/lib/auth/actions";
import type { CurrentUser } from "@/lib/auth/types";
import { can } from "@/lib/roles";
import { Wordmark } from "./wordmark";

function UserMenu({ user }: { user: CurrentUser }) {
  const t = useTranslations("app");
  const tRoles = useTranslations("roles");
  const name = user.fullName ?? user.email;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-10 items-center gap-2 rounded-control px-1.5 transition-colors hover:bg-mauve-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Avatar name={name} src={user.avatarUrl ?? undefined} size="sm" />
          <span className="hidden min-w-0 text-start sm:block">
            <span className="block max-w-[140px] truncate text-label leading-tight text-ink">
              {name}
            </span>
            <span className="block truncate text-meta leading-tight text-muted">
              {tRoles(user.role)}
            </span>
          </span>
          <ChevronDown className="size-3.5 shrink-0 text-faint" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-52 p-1.5">
        <Link href="/profile" className={menuItemClass()}>
          <UserCircle className="size-4 text-muted" aria-hidden />
          {t("profile")}
        </Link>
        <form action={signOutAction}>
          <button type="submit" className={menuItemClass()}>
            <LogOut className="size-4 text-muted" aria-hidden />
            {t("signOut")}
          </button>
        </form>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Spans the main column only -- the brand lives in `SideNav` on desktop, so
 * this bar carries actions and identity. Below `lg` the side nav is hidden, so
 * the wordmark reappears here.
 *
 * Its height matches the side nav's brand row, so the two bottom borders form
 * one unbroken line across the shell.
 */
export function TopBar({ user }: { user: CurrentUser }) {
  const t = useTranslations("app");

  return (
    <header className="sticky top-0 z-header flex h-14 items-center justify-between gap-3 border-b border-line bg-surface px-3 lg:px-6">
      <Link href="/" className="lg:hidden">
        <Wordmark size={18} />
      </Link>

      <div className="ms-auto flex items-center gap-1.5">
        {can(user.role, "createOrders") ? (
          <Button asChild>
            <Link href="/orders/new">
              <Plus aria-hidden />
              <span className="hidden sm:inline">{t("newOrder")}</span>
            </Link>
          </Button>
        ) : null}
        <FeedbackDialog
          trigger={
            <IconButton
              icon={<MessageSquare className="size-[18px]" aria-hidden />}
              label={t("feedback")}
            />
          }
        />
        <UserMenu user={user} />
      </div>
    </header>
  );
}
