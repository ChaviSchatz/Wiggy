"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isPlatformAdmin } from "./is-platform-admin";
import { isValidSlug } from "./slug";

const DEFAULT_TIMEZONE = "Asia/Jerusalem";

type TenantErrorCode =
  | "missingFields"
  | "invalidSlug"
  | "slugTaken"
  | "invalidEmail"
  | "invalidTimezone"
  | "generic";

class TenantActionError extends Error {
  constructor(public readonly code: TenantErrorCode) {
    super(code);
  }
}

function redirectPath(path: string, params: Record<string, string>) {
  const search = new URLSearchParams(params).toString();
  return search ? `${path}?${search}` : path;
}

async function getSiteOrigin(): Promise<string> {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit;

  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "localhost:3000";
  const proto = requestHeaders.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidTimeZone(timezone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

type AdminClient = ReturnType<typeof createAdminClient>;

/**
 * Finds the business by slug, or creates it. A slug that already belongs to
 * a business with the *same* name and timezone is treated as a retry of this
 * same submission (idempotent — see the design spec) and reused. A slug that
 * belongs to a business with different fields is a real collision with an
 * unrelated business.
 */
async function findOrCreateBusiness(
  admin: AdminClient,
  input: { name: string; slug: string; timezone: string },
): Promise<string> {
  const existing = await admin
    .from("businesses")
    .select("id, name, timezone")
    .eq("slug", input.slug)
    .maybeSingle();
  if (existing.error) throw new TenantActionError("generic");

  if (existing.data) {
    const sameSubmission =
      existing.data.name === input.name &&
      existing.data.timezone === input.timezone;
    if (!sameSubmission) throw new TenantActionError("slugTaken");
    return existing.data.id;
  }

  const inserted = await admin
    .from("businesses")
    .insert({ name: input.name, slug: input.slug, timezone: input.timezone })
    .select("id")
    .single();
  if (inserted.error) {
    if (inserted.error.code === "23505") {
      throw new TenantActionError("slugTaken");
    }
    throw new TenantActionError("generic");
  }
  return inserted.data.id;
}

/** The admin list API is paginated; scan until the email is found or the pages run out (same approach as `scripts/seed-dev.ts`). */
async function findUserIdByEmail(
  admin: AdminClient,
  email: string,
): Promise<string | undefined> {
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw new TenantActionError("generic");
    const match = data.users.find((u) => u.email === email);
    if (match) return match.id;
    if (data.users.length < 200) return undefined;
  }
}

/**
 * Finds or invites the admin user, then sets their display name (the
 * `handle_new_user` trigger only sets id/email — `scripts/seed-dev.ts` fills
 * this same gap manually). Returns the user id for the membership upsert.
 */
async function findOrInviteAdmin(
  admin: AdminClient,
  input: { email: string; fullName: string },
  redirectTo: string,
): Promise<string> {
  let userId = await findUserIdByEmail(admin, input.email);
  if (!userId) {
    const invited = await admin.auth.admin.inviteUserByEmail(input.email, {
      data: { full_name: input.fullName },
      redirectTo,
    });
    if (invited.error || !invited.data.user) {
      throw new TenantActionError("generic");
    }
    userId = invited.data.user.id;
  }

  const updated = await admin
    .from("profiles")
    .update({ full_name: input.fullName })
    .eq("id", userId);
  if (updated.error) throw new TenantActionError("generic");

  return userId;
}

export async function createTenantAction(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!isPlatformAdmin(authData.user?.email)) {
    redirect("/");
  }

  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const timezone =
    String(formData.get("timezone") ?? "").trim() || DEFAULT_TIMEZONE;
  const adminName = String(formData.get("adminName") ?? "").trim();
  const adminEmail = String(formData.get("adminEmail") ?? "").trim();

  const fieldParams = { name, slug, timezone, adminName, adminEmail };

  if (!name || !slug || !adminName || !adminEmail) {
    redirect(
      redirectPath("/platform/new", { ...fieldParams, error: "missingFields" }),
    );
  }
  if (!isValidSlug(slug)) {
    redirect(
      redirectPath("/platform/new", { ...fieldParams, error: "invalidSlug" }),
    );
  }
  if (!isValidEmail(adminEmail)) {
    redirect(
      redirectPath("/platform/new", { ...fieldParams, error: "invalidEmail" }),
    );
  }
  if (!isValidTimeZone(timezone)) {
    redirect(
      redirectPath("/platform/new", {
        ...fieldParams,
        error: "invalidTimezone",
      }),
    );
  }

  const admin = createAdminClient();
  const origin = await getSiteOrigin();

  try {
    const businessId = await findOrCreateBusiness(admin, {
      name,
      slug,
      timezone,
    });
    const userId = await findOrInviteAdmin(
      admin,
      { email: adminEmail, fullName: adminName },
      `${origin}/reset-password`,
    );

    const membership = await admin
      .from("memberships")
      .upsert(
        { user_id: userId, business_id: businessId, role: "admin" },
        { onConflict: "user_id,business_id" },
      );
    if (membership.error) throw new TenantActionError("generic");
  } catch (error) {
    const code = error instanceof TenantActionError ? error.code : "generic";
    redirect(redirectPath("/platform/new", { ...fieldParams, error: code }));
  }

  redirect(redirectPath("/platform", { created: slug }));
}
