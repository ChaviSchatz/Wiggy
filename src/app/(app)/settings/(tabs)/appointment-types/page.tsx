import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCurrentUser } from "@/lib/auth/server";
import { listAppointmentTypes } from "@/lib/appointment-types/queries";
import { can } from "@/lib/roles";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AppointmentTypeFormDialog } from "./appointment-type-form-dialog";
import { AppointmentTypeRowActions } from "./appointment-type-row-actions";

/** Appointment types settings screen (screen inventory #74, design spec). */
export default async function AppointmentTypesSettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!can(user.role, "editWorkDefinition")) redirect("/");

  const supabase = await createServerSupabaseClient();
  const types = await listAppointmentTypes(supabase, user.businessId);

  const t = await getTranslations("pages.settings.appointmentTypes");

  return (
    <div>
      <div className="mb-4">
        <AppointmentTypeFormDialog />
      </div>

      {types.length === 0 ? (
        <EmptyState title={t("emptyTitle")} description={t("emptyDescription")} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("columns.name")}</TableHead>
              <TableHead>{t("columns.duration")}</TableHead>
              <TableHead>{t("columns.status")}</TableHead>
              <TableHead>{t("columns.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {types.map((type) => (
              <TableRow key={type.id} className={type.is_active ? undefined : "opacity-60"}>
                <TableCell>{type.name}</TableCell>
                <TableCell>
                  {type.default_duration_minutes
                    ? t("durationMinutes", { minutes: type.default_duration_minutes })
                    : t("noDuration")}
                </TableCell>
                <TableCell>
                  {type.is_active ? t("status.active") : t("status.inactive")}
                </TableCell>
                <TableCell>
                  <AppointmentTypeRowActions type={type} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
