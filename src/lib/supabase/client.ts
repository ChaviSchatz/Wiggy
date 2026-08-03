"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseAnonKey, getSupabaseUrl } from "./env";
import type { Database } from "./database.types";

/**
 * Browser Supabase client (cookie-backed session via `@supabase/ssr`), so the
 * session is visible to Server Components/Actions and middleware too — not
 * just this tab's `localStorage`.
 *
 * Memoized so it is constructed once per page load: the client's
 * `detectSessionInUrl` step (recovery/invite links) only needs to run once.
 */
let browserClient: ReturnType<typeof createBrowserClient<Database>> | undefined;

export function getBrowserClient() {
  if (!browserClient) {
    browserClient = createBrowserClient<Database>(
      getSupabaseUrl(),
      getSupabaseAnonKey(),
    );
  }
  return browserClient;
}
