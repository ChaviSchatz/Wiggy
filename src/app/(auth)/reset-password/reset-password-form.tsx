"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getBrowserClient } from "@/lib/supabase/client";
import { updatePasswordAction } from "@/lib/auth/actions";

type SessionState = "checking" | "ready" | "invalid";

/**
 * The recovery link only ever carries its token in the browser (URL
 * fragment) — the server middleware never sees it. This client component
 * waits for the Supabase browser client to turn that fragment into a
 * session (or reports it as invalid/expired) before showing the form; the
 * actual password update runs server-side in `updatePasswordAction`.
 */
export function ResetPasswordForm({ errorCode }: { errorCode?: string }) {
  const t = useTranslations("auth.resetPassword");
  const [state, setState] = useState<SessionState>("checking");

  useEffect(() => {
    const supabase = getBrowserClient();
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (active) setState(data.session ? "ready" : "invalid");
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!active) return;
        if (event === "PASSWORD_RECOVERY" || session) {
          setState("ready");
        }
      },
    );

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  if (state === "checking") {
    return <p className="text-sm text-muted">{t("loading")}</p>;
  }

  if (state === "invalid") {
    return (
      <div className="space-y-4">
        <FormMessage variant="error">{t("invalidLink")}</FormMessage>
        <Link
          href="/forgot-password"
          className="block text-center text-sm text-mauve-600 hover:underline"
        >
          {t("requestNewLink")}
        </Link>
      </div>
    );
  }

  return (
    <form action={updatePasswordAction} className="space-y-4">
      {errorCode ? (
        <FormMessage variant="error">
          {t(
            errorCode === "tooShort"
              ? "passwordTooShort"
              : errorCode === "mismatch"
                ? "passwordMismatch"
                : "genericError",
          )}
        </FormMessage>
      ) : null}
      <div className="space-y-1.5">
        <Label htmlFor="password">{t("passwordLabel")}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={6}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword">{t("confirmPasswordLabel")}</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          minLength={6}
          required
        />
      </div>
      <Button type="submit" className="w-full">
        {t("submit")}
      </Button>
    </form>
  );
}
