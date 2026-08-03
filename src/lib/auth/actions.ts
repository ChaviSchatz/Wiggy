"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUserFromClient, landingPathForRole } from "./current-user";

const MIN_PASSWORD_LENGTH = 6;

async function getSiteOrigin(): Promise<string> {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit;

  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "localhost:3000";
  const proto = requestHeaders.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

function redirectPath(path: string, params: Record<string, string>) {
  const search = new URLSearchParams(params).toString();
  return search ? `${path}?${search}` : path;
}

/** Signs in with email/password and redirects to `next` or the role landing. */
export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "").trim();

  if (!email || !password) {
    redirect(
      redirectPath("/login", {
        error: "missingFields",
        ...(next ? { next } : {}),
      }),
    );
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(
      redirectPath("/login", {
        error: "invalidCredentials",
        ...(next ? { next } : {}),
      }),
    );
  }

  if (next.startsWith("/")) {
    redirect(next);
  }

  const user = await getCurrentUserFromClient(supabase);
  redirect(user ? landingPathForRole(user.role) : "/");
}

/** Signs the current user out and returns them to the login screen. */
export async function signOutAction() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/**
 * Requests a password-reset email. Always redirects to the same "sent"
 * confirmation regardless of whether the email matches an account, so the
 * screen never reveals which emails have accounts (ADR-less; standard
 * practice, not a product decision).
 */
export async function requestPasswordResetAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    redirect(redirectPath("/forgot-password", { error: "missingEmail" }));
  }

  const supabase = await createServerSupabaseClient();
  const origin = await getSiteOrigin();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/reset-password`,
  });

  redirect(redirectPath("/forgot-password", { sent: "1" }));
}

/** Sets a new password for the (recovery-session) current user. */
export async function updatePasswordAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (password.length < MIN_PASSWORD_LENGTH) {
    redirect(redirectPath("/reset-password", { error: "tooShort" }));
  }
  if (password !== confirmPassword) {
    redirect(redirectPath("/reset-password", { error: "mismatch" }));
  }

  const supabase = await createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect(redirectPath("/reset-password", { error: "noSession" }));
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    redirect(redirectPath("/reset-password", { error: "generic" }));
  }

  await supabase.auth.signOut();
  redirect(redirectPath("/login", { reset: "success" }));
}

/** Completes first-login bootstrap by setting the user's display name. */
export async function bootstrapProfileAction(formData: FormData) {
  const fullName = String(formData.get("fullName") ?? "").trim();
  if (!fullName) {
    redirect(redirectPath("/bootstrap", { error: "missingName" }));
  }

  const supabase = await createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect("/login");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", userData.user.id);

  if (error) {
    redirect(redirectPath("/bootstrap", { error: "generic" }));
  }

  const user = await getCurrentUserFromClient(supabase);
  redirect(user ? landingPathForRole(user.role) : "/");
}

/** Updates the current user's display name from the profile screen. */
export async function updateProfileAction(formData: FormData) {
  const fullName = String(formData.get("fullName") ?? "").trim();
  if (!fullName) {
    redirect(redirectPath("/profile", { profileError: "missingName" }));
  }

  const supabase = await createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect("/login");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", userData.user.id);

  if (error) {
    redirect(redirectPath("/profile", { profileError: "generic" }));
  }

  revalidatePath("/profile");
  redirect(redirectPath("/profile", { saved: "1" }));
}

/** Changes the current user's password from the profile screen. */
export async function changePasswordAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (password.length < MIN_PASSWORD_LENGTH) {
    redirect(redirectPath("/profile", { passwordError: "tooShort" }));
  }
  if (password !== confirmPassword) {
    redirect(redirectPath("/profile", { passwordError: "mismatch" }));
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect(redirectPath("/profile", { passwordError: "generic" }));
  }

  redirect(redirectPath("/profile", { passwordChanged: "1" }));
}
