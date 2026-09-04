"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { changePasswordAction } from "@/lib/auth/actions";

export function ChangePasswordForm() {
  const t = useTranslations("pages.profile");

  return (
    <form action={changePasswordAction} className="space-y-4">
      <FormField label={t("newPasswordLabel")} htmlFor="password">
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
      <Button type="submit">{t("changePassword")}</Button>
    </form>
  );
}
