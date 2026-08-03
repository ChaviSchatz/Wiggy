import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { getCurrentUser } from "@/lib/auth/server";

/**
 * Wraps every authenticated screen in the app shell (TopBar/SideNav/BottomBar).
 * `middleware.ts` already enforces the session + first-login-bootstrap gate;
 * the redirect here is defence-in-depth for the rare direct hit that slips
 * past it (e.g. a session that expired between the request and this render).
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return <AppShell user={user}>{children}</AppShell>;
}
