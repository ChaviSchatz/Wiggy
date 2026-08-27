import type { CurrentUser } from "@/lib/auth/types";

import { BottomNav } from "./bottom-nav";
import { SideNav } from "./side-nav";
import { TopBar } from "./top-bar";

/**
 * Full-height side nav beside a main column, with the top bar spanning the
 * main column only (design-system.md §4) -- the brand belongs to the side nav,
 * not to a bar stretched across the whole viewport.
 */
export function AppShell({
  user,
  children,
}: {
  user: CurrentUser;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <SideNav user={user} role={user.role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar user={user} />
        <main className="flex-1 px-3 pb-24 pt-6 lg:px-6 lg:pb-8">
          {children}
        </main>
      </div>
      <BottomNav role={user.role} />
    </div>
  );
}
