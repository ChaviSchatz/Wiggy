import Link from "next/link";
import { useTranslations } from "next-intl";

import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
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
        <FormField label={t("emailLabel")} htmlFor="email">
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        </FormField>
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
