import Link from "next/link";
import { useTranslations } from "next-intl";

import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { signInAction } from "@/lib/auth/actions";

type SearchParams = { [key: string]: string | string[] | undefined };

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const t = useTranslations("auth.login");

  const next = firstParam(searchParams.next) ?? "";
  const error = firstParam(searchParams.error);
  const resetSuccess = firstParam(searchParams.reset) === "success";

  return (
    <AuthCard title={t("title")} subtitle={t("subtitle")}>
      {resetSuccess ? (
        <FormMessage variant="success">{t("resetSuccess")}</FormMessage>
      ) : null}
      {error ? (
        <FormMessage variant="error">
          {t(
            error === "missingFields" ? "missingFields" : "invalidCredentials",
          )}
        </FormMessage>
      ) : null}

      <form action={signInAction} className="space-y-4">
        <input type="hidden" name="next" value={next} />
        <FormField label={t("emailLabel")} htmlFor="email">
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        </FormField>
        <FormField
          htmlFor="password"
          label={t("passwordLabel")}
          labelAction={
            <Link
              href="/forgot-password"
              className="text-sm text-mauve-600 hover:underline"
            >
              {t("forgotPassword")}
            </Link>
          }
        >
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </FormField>
        <Button type="submit" className="w-full">
          {t("submit")}
        </Button>
      </form>
    </AuthCard>
  );
}
