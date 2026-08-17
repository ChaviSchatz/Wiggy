import { redirect } from "next/navigation";

import { fetchBoardTasks } from "@/lib/board/queries";
import { getCurrentUser } from "@/lib/auth/server";
import { can } from "@/lib/roles";
import {
  fetchRecentlyCompletedTasksForStaff,
  fetchStaffMemberIdForUser,
} from "@/lib/sprints/queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { MyWorkQueue } from "./my-work-queue";

export default async function MyWorkPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!can(user.role, "workOwnTasks")) redirect("/");

  const supabase = await createServerSupabaseClient();
  const staffMemberId = await fetchStaffMemberIdForUser(
    supabase,
    user.businessId,
    user.id,
  );

  const [tasks, completed] = await Promise.all([
    fetchBoardTasks(supabase, user.businessId),
    staffMemberId
      ? fetchRecentlyCompletedTasksForStaff(supabase, user.businessId, staffMemberId)
      : Promise.resolve([]),
  ]);

  return (
    <MyWorkQueue
      staffMemberId={staffMemberId}
      initialTasks={tasks}
      completed={completed}
    />
  );
}
