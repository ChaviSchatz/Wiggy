"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
      <div className="space-y-1.5">
        <Label htmlFor="fullName">{t("fullNameLabel")}</Label>
        <Input
          id="fullName"
          name="fullName"
          defaultValue={defaultFullName}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">{t("emailLabel")}</Label>
        <Input id="email" value={email} disabled readOnly />
      </div>
      <Button type="submit">{t("saveProfile")}</Button>
    </form>
  );
}
