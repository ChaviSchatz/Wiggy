import { useTranslations } from "next-intl";

import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { bootstrapProfileAction } from "@/lib/auth/actions";

type SearchParams = { [key: string]: string | string[] | undefined };

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * First-login completion (docs/ui/screen-inventory.md #4). Reached today by
 * any freshly authenticated user whose profile has no display name yet
 * (gated by `middleware.ts`). A real "accept invite" email flow — once the
 * future Users & Roles admin screen can send one — is a superset of this
 * same gate; wiring that up is deferred with that screen.
 */
export default function BootstrapPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const t = useTranslations("auth.bootstrap");
  const error = firstParam(searchParams.error);

  return (
    <AuthCard title={t("title")} subtitle={t("subtitle")}>
      {error ? (
        <FormMessage variant="error">
          {t(error === "missingName" ? "missingName" : "genericError")}
        </FormMessage>
      ) : null}

      <form action={bootstrapProfileAction} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="fullName">{t("fullNameLabel")}</Label>
          <Input id="fullName" name="fullName" autoComplete="name" required />
        </div>
        <Button type="submit" className="w-full">
          {t("submit")}
        </Button>
      </form>
    </AuthCard>
  );
}
