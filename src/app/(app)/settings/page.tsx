import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/server";
import { visibleSettingsSections } from "./sections";

/**
 * `/settings` itself is no longer a picker (screen inventory #44) -- the tab
 * row in `(tabs)/layout.tsx` does that job now. This just lands a role on
 * whichever section it can actually see.
 */
export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const sections = visibleSettingsSections(user.role);
  if (sections.length === 0) redirect("/");

  redirect(sections[0].href);
}
