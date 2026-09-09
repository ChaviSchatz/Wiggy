import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { Wordmark } from "@/components/layout/wordmark";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/lib/auth/actions";
import { isPlatformAdmin } from "@/lib/platform-admin/is-platform-admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * No `AppShell`/`SideNav` here — there is no salon context to render for a
 * platform admin, who by definition has no business membership. This is the
 * only gate: an allowlisted email, checked fresh on every request (see
 * design spec — never trust the route alone; `createTenantAction` re-checks
 * this too).
 */
export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.auth.getUser();
  if (!isPlatformAdmin(data.user?.email)) {
    redirect("/");
  }

  const appT = await getTranslations("app");
  const t = await getTranslations("platformAdmin");

  return (
    <div className="min-h-screen bg-bg">
      <header className="flex items-center justify-between border-b border-line bg-surface px-6 py-3">
        <Link href="/platform" className="flex items-center gap-2">
          <Wordmark text={appT("name")} size={22} />
        </Link>
        <form action={signOutAction}>
          <Button type="submit" variant="ghost">
            {t("signOut")}
          </Button>
        </form>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-8">{children}</main>
    </div>
  );
}
