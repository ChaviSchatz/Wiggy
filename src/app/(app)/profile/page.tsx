import { redirect } from "next/navigation";
import { useTranslations } from "next-intl";

import { PageHeader } from "@/components/layout/page-header";
import { Avatar } from "@/components/ui/avatar";
import { FormMessage } from "@/components/ui/form-message";
import { Panel } from "@/components/ui/panel";
import { getCurrentUser } from "@/lib/auth/server";
import { ChangePasswordForm } from "./change-password-form";
import { ProfileForm } from "./profile-form";

type SearchParams = { [key: string]: string | string[] | undefined };

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return <ProfileView user={user} searchParams={searchParams} />;
}

function ProfileView({
  user,
  searchParams,
}: {
  user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
  searchParams: SearchParams;
}) {
  const t = useTranslations("pages.profile");
  const tRoles = useTranslations("roles");

  const saved = firstParam(searchParams.saved) === "1";
  const passwordChanged = firstParam(searchParams.passwordChanged) === "1";
  const profileError = firstParam(searchParams.profileError);
  const passwordError = firstParam(searchParams.passwordError);

  return (
    <div>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <div className="grid max-w-lg gap-4">
        <Panel
          title={t("detailsTitle")}
          subtitle={`${t("roleLabel")}: ${tRoles(user.role)} · ${t("businessLabel")}: ${user.businessName}`}
          bodyClassName="space-y-4"
        >
          <Avatar name={user.fullName ?? null} size="lg" />
          {saved ? (
            <FormMessage variant="success">{t("profileSaved")}</FormMessage>
          ) : null}
          {profileError ? (
            <FormMessage variant="error">
              {t(`errors.${profileError}`)}
            </FormMessage>
          ) : null}
          <ProfileForm
            defaultFullName={user.fullName ?? ""}
            email={user.email ?? ""}
          />
        </Panel>

        <Panel title={t("changePasswordTitle")} bodyClassName="space-y-4">
          {passwordChanged ? (
            <FormMessage variant="success">
              {t("passwordChanged")}
            </FormMessage>
          ) : null}
          {passwordError ? (
            <FormMessage variant="error">
              {t(`errors.${passwordError}`)}
            </FormMessage>
          ) : null}
          <ChangePasswordForm />
        </Panel>
      </div>
    </div>
  );
}
