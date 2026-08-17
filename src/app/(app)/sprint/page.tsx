import { redirect } from "next/navigation";

import { fetchAssignableStaff, fetchBoardTasks } from "@/lib/board/queries";
import { getCurrentUser } from "@/lib/auth/server";
import { can } from "@/lib/roles";
import {
  fetchActiveSprint,
  fetchSprintCadenceDays,
} from "@/lib/sprints/queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { fetchActiveWorkStages } from "@/lib/work-orders/queries";
import { SprintPlanningBoard } from "./sprint-planning-board";

export default async function SprintPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!can(user.role, "planSprint")) redirect("/");

  const supabase = await createServerSupabaseClient();
  const [sprint, cadenceDays, tasks, staff, stages] = await Promise.all([
    fetchActiveSprint(supabase, user.businessId),
    fetchSprintCadenceDays(supabase, user.businessId),
    fetchBoardTasks(supabase, user.businessId),
    fetchAssignableStaff(supabase, user.businessId),
    fetchActiveWorkStages(supabase, user.businessId),
  ]);

  return (
    <SprintPlanningBoard
      sprint={sprint}
      cadenceDays={cadenceDays}
      initialTasks={tasks}
      staff={staff}
      stages={stages}
    />
  );
}
