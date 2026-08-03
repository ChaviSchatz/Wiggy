import Link from "next/link";
import { useTranslations } from "next-intl";

import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordResetAction } from "@/lib/auth/actions";

type SearchParams = { [key: string]: string | string[] | undefined };

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const t = useTranslations("auth.forgotPassword");

  const sent = firstParam(searchParams.sent) === "1";
  const error = firstParam(searchParams.error);

  return (
    <AuthCard title={t("title")} subtitle={t("subtitle")}>
      {sent ? (
        <FormMessage variant="success">{t("success")}</FormMessage>
      ) : null}
      {error ? (
        <FormMessage variant="error">{t("missingEmail")}</FormMessage>
      ) : null}

      <form action={requestPasswordResetAction} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">{t("emailLabel")}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        </div>
        <Button type="submit" className="w-full">
          {t("submit")}
        </Button>
      </form>

      <Link
        href="/login"
        className="block text-center text-sm text-mauve-600 hover:underline"
      >
        {t("backToLogin")}
      </Link>
    </AuthCard>
  );
}
