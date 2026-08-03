import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

/**
 * Publicly reachable without a session. Everything else requires auth.
 * `/reset-password` stays public even when authenticated (the recovery link
 * establishes a session before the new password is set) — see
 * docs/domains/identity-and-tenancy.md and the Slice 1 plan.
 */
const PUBLIC_PATHS = ["/login", "/forgot-password", "/reset-password"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export async function middleware(request: NextRequest) {
  const { supabase, response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  if (!user) {
    if (isPublicPath(pathname)) return response;

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Signed in: keep users away from the login/forgot-password screens.
  if (pathname === "/login" || pathname === "/forgot-password") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // `/reset-password` is exempt from the first-login bootstrap gate below —
  // a user resetting their password mid-recovery may not have completed it
  // yet, and that is not what this screen is for.
  if (pathname !== "/reset-password") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();

    const hasCompletedProfile = Boolean(profile?.full_name?.trim());

    if (!hasCompletedProfile && pathname !== "/bootstrap") {
      return NextResponse.redirect(new URL("/bootstrap", request.url));
    }
    if (hasCompletedProfile && pathname === "/bootstrap") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
