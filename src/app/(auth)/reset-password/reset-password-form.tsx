"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
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
      <FormField label={t("passwordLabel")} htmlFor="password">
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={6}
          required
        />
      </FormField>
      <FormField label={t("confirmPasswordLabel")} htmlFor="confirmPassword">
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          minLength={6}
          required
        />
      </FormField>
      <Button type="submit" className="w-full">
        {t("submit")}
      </Button>
    </form>
  );
}
