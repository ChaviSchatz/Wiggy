import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUserFromClient } from "./current-user";
import type { CurrentUser } from "./types";

/** The current user for Server Components/Actions, or `null` if signed out. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createServerSupabaseClient();
  return getCurrentUserFromClient(supabase);
}
