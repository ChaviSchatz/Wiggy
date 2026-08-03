/**
 * Public Supabase env vars (safe in the browser). Shared by the browser,
 * server, and middleware client factories so the "missing env var" error is
 * consistent and defined once.
 */
export function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error("Missing Supabase env var: set NEXT_PUBLIC_SUPABASE_URL.");
  }
  return url;
}

export function getSupabaseAnonKey(): string {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey) {
    throw new Error(
      "Missing Supabase env var: set NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }
  return anonKey;
}
