import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/server";
import {
  countOpenTasksForPerson,
  fetchLastSignInAt,
  listPeople,
} from "@/lib/people/queries";
import { can } from "@/lib/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { fetchActiveWorkStages } from "@/lib/work-orders/queries";
import { PeoplePageClient } from "./people-page-client";

type SearchParams = { [key: string]: string | string[] | undefined };

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

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

  const openTaskCountsMap = new Map(
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

  const linkedUserIds = visible
    .map((person) => person.user_id)
    .filter((id): id is string => Boolean(id));
  const lastSignInsMap =
    canManageAccess && linkedUserIds.length > 0
      ? await fetchLastSignInAt(createAdminClient(), linkedUserIds)
      : new Map<string, string | null>();

  const stageOptions = stages.map((stage) => ({
    id: stage.id,
    name: stage.name,
  }));

  // Convert Maps to plain Records for client serialization
  const openTaskCounts: Record<string, number> = Object.fromEntries(
    openTaskCountsMap,
  );
  const lastSignIns: Record<string, string | null> =
    Object.fromEntries(lastSignInsMap);

  return (
    <PeoplePageClient
      people={visible}
      stages={stageOptions}
      openTaskCounts={openTaskCounts}
      lastSignIns={lastSignIns}
      canManageAccess={canManageAccess}
      showInactive={showInactive}
    />
  );
}
