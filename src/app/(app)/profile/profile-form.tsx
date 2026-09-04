"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { updateProfileAction } from "@/lib/auth/actions";

export function ProfileForm({
  defaultFullName,
  email,
}: {
  defaultFullName: string;
  email: string;
}) {
  const t = useTranslations("pages.profile");

  return (
    <form action={updateProfileAction} className="space-y-4">
      <FormField label={t("fullNameLabel")} htmlFor="fullName">
        <Input
          id="fullName"
          name="fullName"
          defaultValue={defaultFullName}
          required
        />
      </FormField>
      <FormField label={t("emailLabel")} htmlFor="email">
        <Input id="email" value={email} disabled readOnly />
      </FormField>
      <Button type="submit">{t("saveProfile")}</Button>
    </form>
  );
}
