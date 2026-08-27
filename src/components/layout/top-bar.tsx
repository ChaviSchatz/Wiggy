"use client";

import Link from "next/link";
import { LogOut, MessageSquare, Plus, UserCircle } from "lucide-react";
import { useTranslations } from "next-intl";

import { FeedbackDialog } from "@/components/feedback/feedback-dialog";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/lib/auth/actions";
import type { CurrentUser } from "@/lib/auth/types";
import { can } from "@/lib/roles";

/**
 * Spans the main column only -- the brand and the current user live in
 * `SideNav` on desktop, so this bar carries actions. Below `lg` the side nav is
 * hidden, so the wordmark reappears here.
 */
export function TopBar({ user }: { user: CurrentUser }) {
  const t = useTranslations("app");

  return (
    <header className="sticky top-0 z-header flex h-[69px] items-center justify-between gap-3 border-b border-line bg-surface px-4 lg:px-6">
      <Link
        href="/"
        className="font-display text-body-lg font-bold text-mauve-600 lg:hidden"
      >
        {t("name")}
      </Link>

      <div className="ms-auto flex items-center gap-2">
        {can(user.role, "createOrders") ? (
          <Button size="primary" asChild>
            <Link href="/orders/new">
              <Plus aria-hidden />
              <span className="hidden sm:inline">{t("newOrder")}</span>
            </Link>
          </Button>
        ) : null}
        <FeedbackDialog
          trigger={
            <Button variant="ghost" size="icon" aria-label={t("feedback")}>
              <MessageSquare className="size-5" aria-hidden />
            </Button>
          }
        />
        <Button variant="ghost" size="icon" aria-label={t("profile")} asChild>
          <Link href="/profile">
            <UserCircle className="size-5" aria-hidden />
          </Link>
        </Button>
        <form action={signOutAction}>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("signOut")}
            type="submit"
          >
            <LogOut className="size-5" aria-hidden />
          </Button>
        </form>
      </div>
    </header>
  );
}
