import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/ui/panel";
import { createTenantAction } from "@/lib/platform-admin/actions";

const DEFAULT_TIMEZONE = "Asia/Jerusalem";

type SearchParams = { [key: string]: string | string[] | undefined };

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function NewTenantPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const t = await getTranslations("platformAdmin.new");
  const error = firstParam(searchParams.error);

  const name = firstParam(searchParams.name) ?? "";
  const slug = firstParam(searchParams.slug) ?? "";
  const timezone = firstParam(searchParams.timezone) || DEFAULT_TIMEZONE;
  const adminName = firstParam(searchParams.adminName) ?? "";
  const adminEmail = firstParam(searchParams.adminEmail) ?? "";

  return (
    <Panel
      title={t("title")}
      subtitle={t("subtitle")}
      bodyClassName="space-y-4"
    >
      {error ? (
        <FormMessage variant="error">{t(`errors.${error}`)}</FormMessage>
      ) : null}

      <form action={createTenantAction} className="space-y-4">
        <FormField label={t("nameLabel")} htmlFor="name" required>
          <Input id="name" name="name" defaultValue={name} required />
        </FormField>
        <FormField
          label={t("slugLabel")}
          htmlFor="slug"
          description={t("slugHelp")}
          required
        >
          <Input id="slug" name="slug" defaultValue={slug} required />
        </FormField>
        <FormField label={t("timezoneLabel")} htmlFor="timezone" required>
          <Input
            id="timezone"
            name="timezone"
            defaultValue={timezone}
            required
          />
        </FormField>
        <FormField label={t("adminNameLabel")} htmlFor="adminName" required>
          <Input
            id="adminName"
            name="adminName"
            defaultValue={adminName}
            required
          />
        </FormField>
        <FormField label={t("adminEmailLabel")} htmlFor="adminEmail" required>
          <Input
            id="adminEmail"
            name="adminEmail"
            type="email"
            defaultValue={adminEmail}
            required
          />
        </FormField>
        <Button type="submit" className="w-full">
          {t("submit")}
        </Button>
      </form>
    </Panel>
  );
}
