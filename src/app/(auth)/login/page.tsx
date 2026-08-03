import Link from "next/link";
import { useTranslations } from "next-intl";

import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{t("passwordLabel")}</Label>
            <Link
              href="/forgot-password"
              className="text-sm text-mauve-600 hover:underline"
            >
              {t("forgotPassword")}
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>
        <Button type="submit" className="w-full">
          {t("submit")}
        </Button>
      </form>
    </AuthCard>
  );
}
