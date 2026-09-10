import { headers } from "next/headers";

/**
 * The origin invite/reset emails should point back at.
 *
 * Kept out of `./index` so that module stays free of `next/headers` and can be
 * unit-tested as plain functions.
 *
 * `NEXT_PUBLIC_SITE_URL` wins when set. Note that Supabase Auth's own
 * Redirect URL allowlist must contain a wildcard entry for the path to
 * survive -- a bare origin silently drops it (see Part C of the platform-admin
 * design spec).
 */
export async function getSiteOrigin(): Promise<string> {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit;

  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "localhost:3000";
  const proto = requestHeaders.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}
