"use client";

import Link from "next/link";
import { Plus, UserCircle } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

export function TopBar() {
  const t = useTranslations("app");

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-line bg-surface px-4">
      <Link href="/" className="text-lg font-bold text-mauve-600">
        {t("name")}
      </Link>

      <div className="flex items-center gap-2">
        <Button size="sm">
          <Plus aria-hidden />
          <span className="hidden sm:inline">{t("newOrder")}</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("profile")}
          type="button"
        >
          <UserCircle className="size-6" aria-hidden />
        </Button>
      </div>
    </header>
  );
}
