import { createClient } from "@supabase/supabase-js";

/**
 * Browser Supabase client factory.
 *
 * This slice ships the client stub only — no auth/session wiring or database
 * schema yet. Reads public env vars that must be provided at build/runtime.
 */
export function createBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase env vars: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  return createClient(url, anonKey);
}
