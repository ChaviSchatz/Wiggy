import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { getSupabaseAnonKey, getSupabaseUrl } from "./env";
import type { Database } from "./database.types";

/**
 * Server-side Supabase client (cookie-backed session) for Server
 * Components, Server Actions, and Route Handlers. Runs as the signed-in
 * user — RLS applies exactly as it would in the browser.
 *
 * Writing cookies only works from Server Actions/Route Handlers; a call from
 * a plain Server Component is a no-op (middleware is what refreshes the
 * session on every request, per the Supabase SSR pattern).
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component render — middleware refreshes
          // the session cookie on the next request instead.
        }
      },
    },
  });
}
