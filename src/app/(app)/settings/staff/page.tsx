import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/layout/page-header";
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
import { can } from "@/lib/roles";
import { countOpenTasksForStaff, listStaffMembers } from "@/lib/staff/queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { fetchActiveWorkStages } from "@/lib/work-orders/queries";
import { StaffFormDialog } from "./staff-form-dialog";
import { StaffRowActions } from "./staff-row-actions";

type SearchParams = { [key: string]: string | string[] | undefined };

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function StaffSettingsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!can(user.role, "manageStaff")) redirect("/");

  const showInactive = firstParam(searchParams.inactive) === "1";

  const supabase = await createServerSupabaseClient();
  const [staff, stages] = await Promise.all([
    listStaffMembers(supabase, user.businessId),
    fetchActiveWorkStages(supabase, user.businessId),
  ]);
  const visible = showInactive ? staff : staff.filter((s) => s.is_active);

  // The deactivate dialog states how many tasks stay assigned, so the count
  // is resolved server-side and passed down. Only active members can be
  // deactivated, so inactive rows don't need one.
  const openTaskCounts = new Map(
    await Promise.all(
      visible
        .filter((member) => member.is_active)
        .map(
          async (member) =>
            [
              member.id,
              await countOpenTasksForStaff(
                supabase,
                user.businessId,
                member.id,
              ),
            ] as const,
        ),
    ),
  );

  const t = await getTranslations("pages.settings.staff");
  const stageOptions = stages.map((stage) => ({
    id: stage.id,
    name: stage.name,
  }));

  return (
    <div>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      {/* A plain link, not client state: the toggle works without JS and the
          URL stays shareable, like every other list filter in the app. */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <StaffFormDialog stages={stageOptions} />
        <Link
          href={showInactive ? "/settings/staff" : "/settings/staff?inactive=1"}
          className="text-body text-muted underline-offset-4 hover:underline"
        >
          {showInactive ? t("hideInactive") : t("showInactive")}
        </Link>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title={t("emptyTitle")}
          description={t("emptyDescription")}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("columns.name")}</TableHead>
              <TableHead>{t("columns.title")}</TableHead>
              <TableHead>{t("columns.stage")}</TableHead>
              <TableHead>{t("columns.user")}</TableHead>
              <TableHead>{t("columns.status")}</TableHead>
              <TableHead>{t("columns.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((member) => (
              <TableRow
                key={member.id}
                className={member.is_active ? undefined : "opacity-60"}
              >
                <TableCell>{member.full_name}</TableCell>
                <TableCell>{member.title ?? t("none")}</TableCell>
                <TableCell>{member.workStageName ?? t("none")}</TableCell>
                <TableCell>{member.linkedUserName ?? t("none")}</TableCell>
                <TableCell>
                  {member.is_active ? t("status.active") : t("status.inactive")}
                </TableCell>
                <TableCell>
                  <StaffRowActions
                    member={member}
                    stages={stageOptions}
                    openTaskCount={openTaskCounts.get(member.id) ?? 0}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
