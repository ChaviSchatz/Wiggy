import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { Wordmark } from "@/components/layout/wordmark";

/** Archetype I (design-system.md §3): centered Panel, no app-shell chrome. */
export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations("app");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-bg px-4 py-12">
      <Link href="/">
        <Wordmark text={t("name")} size={26} />
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
