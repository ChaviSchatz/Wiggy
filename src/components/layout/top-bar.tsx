"use client";

import Link from "next/link";
import { LogOut, MessageSquare, Plus, UserCircle } from "lucide-react";
import { useTranslations } from "next-intl";

import { FeedbackDialog } from "@/components/feedback/feedback-dialog";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/lib/auth/actions";
import type { CurrentUser } from "@/lib/auth/types";
import { can } from "@/lib/roles";

export function TopBar({ user }: { user: CurrentUser }) {
  const t = useTranslations("app");

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-line bg-surface px-4">
      <Link href="/" className="text-lg font-bold text-mauve-600">
        {t("name")}
      </Link>

      <div className="flex items-center gap-2">
        {can(user.role, "createOrders") ? (
          <Button size="sm" asChild>
            <Link href="/orders">
              <Plus aria-hidden />
              <span className="hidden sm:inline">{t("newOrder")}</span>
            </Link>
          </Button>
        ) : null}
        <FeedbackDialog
          trigger={
            <Button variant="ghost" size="icon" aria-label={t("feedback")}>
              <MessageSquare className="size-6" aria-hidden />
            </Button>
          }
        />
        <Button variant="ghost" size="icon" aria-label={t("profile")} asChild>
          <Link href="/profile">
            <UserCircle className="size-6" aria-hidden />
          </Link>
        </Button>
        <form action={signOutAction}>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("signOut")}
            type="submit"
          >
            <LogOut className="size-6" aria-hidden />
          </Button>
        </form>
      </div>
    </header>
  );
}
