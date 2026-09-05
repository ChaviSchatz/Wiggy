import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/layout/page-header";
import { getCurrentUser } from "@/lib/auth/server";
import { can } from "@/lib/roles";
import { fetchSprintCadenceDays } from "@/lib/sprints/queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { BusinessSettingsForm } from "./business-settings-form";

export default async function BusinessSettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Two gates: tenant identity (name, timezone) is admin-only (mirroring the
  // RLS on `businesses`), sprint cadence is a manager-level operational setting.
  const canEditTimezone = can(user.role, "editBusinessSettings");
  const canEditName = canEditTimezone;
  const canEditCadence = can(user.role, "planSprint");
  if (!canEditTimezone && !canEditCadence) redirect("/");

  const supabase = await createServerSupabaseClient();
  const cadenceDays = await fetchSprintCadenceDays(supabase, user.businessId);

  const t = await getTranslations("pages.settings.business");

  return (
    <div>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <BusinessSettingsForm
        businessName={user.businessName}
        timezone={user.timezone}
        cadenceDays={cadenceDays}
        canEditName={canEditName}
        canEditTimezone={canEditTimezone}
        canEditCadence={canEditCadence}
        // Resolved on the server and passed down, so the client never has to
        // care whether its runtime supports `Intl.supportedValuesOf`.
        timezones={Intl.supportedValuesOf("timeZone")}
      />
    </div>
  );
}
