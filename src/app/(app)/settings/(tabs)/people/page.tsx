import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import {
  derivePersonAccessState,
  type PersonAccessState,
} from "@/lib/people/guards";
import {
  countOpenTasksForPerson,
  fetchLastSignInAt,
  listPeople,
  type PersonListItem,
} from "@/lib/people/queries";
import { can } from "@/lib/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { fetchActiveWorkStages } from "@/lib/work-orders/queries";
import { PersonFormDialog } from "./person-form-dialog";
import { PersonRowActions } from "./person-row-actions";

type SearchParams = { [key: string]: string | string[] | undefined };

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Settings -> People (ADR 0013): every person in the salon, whether or not
 * they have a login.
 *
 * A manager sees the whole list including roles and invite state, but no
 * access controls -- they need to see the people they assign work to. The
 * actions enforce that split themselves.
 */
export default async function PeopleSettingsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!can(user.role, "manageStaff")) redirect("/");

  const canManageAccess = can(user.role, "manageUsers");
  const showInactive = firstParam(searchParams.inactive) === "1";

  const supabase = await createServerSupabaseClient();
  const [people, stages] = await Promise.all([
    listPeople(supabase, user.businessId),
    fetchActiveWorkStages(supabase, user.businessId),
  ]);
  const visible = showInactive ? people : people.filter((p) => p.is_active);

  // The deactivate dialog states how many tasks stay assigned, so the count is
  // resolved server-side. Only active people can be deactivated, so inactive
  // rows don't need one.
  const openTaskCounts = new Map(
    await Promise.all(
      visible
        .filter((person) => person.is_active)
        .map(
          async (person) =>
            [
              person.id,
              await countOpenTasksForPerson(
                supabase,
                user.businessId,
                person.id,
              ),
            ] as const,
        ),
    ),
  );

  // Invite state needs Supabase Auth, which only the service-role client can
  // read -- and only someone who may manage access has any use for it.
  const linkedUserIds = visible
    .map((person) => person.user_id)
    .filter((id): id is string => Boolean(id));
  const lastSignIns =
    canManageAccess && linkedUserIds.length > 0
      ? await fetchLastSignInAt(createAdminClient(), linkedUserIds)
      : new Map<string, string | null>();

  const t = await getTranslations("pages.settings.people");
  const stageOptions = stages.map((stage) => ({
    id: stage.id,
    name: stage.name,
  }));

  function accessStateFor(person: PersonListItem): PersonAccessState {
    return derivePersonAccessState(
      person.user_id,
      person.user_id ? (lastSignIns.get(person.user_id) ?? null) : null,
    );
  }

  return (
    <div>
      {/* A plain link, not client state: the toggle works without JS and the
          URL stays shareable, like every other list filter in the app. */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <PersonFormDialog
          stages={stageOptions}
          canManageAccess={canManageAccess}
        />
        <Link
          href={
            showInactive ? "/settings/people" : "/settings/people?inactive=1"
          }
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
              <TableHead>{t("columns.access")}</TableHead>
              <TableHead>{t("columns.assignable")}</TableHead>
              <TableHead>{t("columns.status")}</TableHead>
              <TableHead>{t("columns.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((person) => {
              const accessState = accessStateFor(person);
              return (
                <TableRow
                  key={person.id}
                  className={person.is_active ? undefined : "opacity-60"}
                >
                  <TableCell>
                    <span className="flex items-center gap-2">
                      <Avatar name={person.full_name} size="sm" />
                      <span>
                        {person.full_name}
                        {person.linkedEmail ? (
                          <span
                            className="block text-meta text-muted"
                            dir="ltr"
                          >
                            {person.linkedEmail}
                          </span>
                        ) : null}
                      </span>
                    </span>
                  </TableCell>
                  <TableCell>{person.title ?? t("none")}</TableCell>
                  <TableCell>{person.workStageName ?? t("none")}</TableCell>
                  <TableCell>
                    <AccessCell person={person} accessState={accessState} />
                  </TableCell>
                  <TableCell>
                    <span className="text-meta text-muted">
                      {person.is_assignable
                        ? t("assignable.yes")
                        : t("assignable.no")}
                    </span>
                  </TableCell>
                  <TableCell>
                    {person.is_active
                      ? t("status.active")
                      : t("status.inactive")}
                  </TableCell>
                  <TableCell>
                    <PersonRowActions
                      person={person}
                      stages={stageOptions}
                      openTaskCount={openTaskCounts.get(person.id) ?? 0}
                      accessState={accessState}
                      canManageAccess={canManageAccess}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

/**
 * Role plus, when relevant, the invite state. "Invited" is a badge and never a
 * gate -- an invited person is fully assignable (ADR 0013).
 */
async function AccessCell({
  person,
  accessState,
}: {
  person: PersonListItem;
  accessState: PersonAccessState;
}) {
  const t = await getTranslations("pages.settings.people");

  if (accessState === "rosterOnly") {
    return <Badge variant="idle">{t("access.noLogin")}</Badge>;
  }

  return (
    <span className="flex flex-wrap items-center gap-1.5">
      {person.role ? (
        <Badge variant="neutral">{t(`roles.${person.role}`)}</Badge>
      ) : null}
      {accessState === "invited" ? (
        <Badge variant="warning">{t("access.invited")}</Badge>
      ) : null}
      {!person.membershipActive ? (
        <Badge variant="idle">{t("access.revoked")}</Badge>
      ) : null}
    </span>
  );
}
