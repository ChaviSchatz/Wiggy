import type { CurrentUser } from "@/lib/auth/types";

import { BottomNav } from "./bottom-nav";
import { SideNav } from "./side-nav";
import { TopBar } from "./top-bar";

export function AppShell({
  user,
  children,
}: {
  user: CurrentUser;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <TopBar user={user} />
      <div className="flex">
        <SideNav role={user.role} />
        <main className="flex-1 px-4 pb-24 pt-6 lg:px-8 lg:pb-8">
          {children}
        </main>
      </div>
      <BottomNav role={user.role} />
    </div>
  );
}
