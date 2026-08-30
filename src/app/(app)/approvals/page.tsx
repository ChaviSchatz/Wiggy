import { redirect } from "next/navigation";

import { fetchBoardTasks } from "@/lib/board/queries";
import { getCurrentUser } from "@/lib/auth/server";
import { can } from "@/lib/roles";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ApprovalsList } from "./approvals-list";

export default async function ApprovalsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!can(user.role, "approveTasks")) redirect("/");

  const supabase = await createServerSupabaseClient();
  const tasks = await fetchBoardTasks(supabase, user.businessId);
  const awaitingApproval = tasks.filter(
    (task) => task.status === "awaiting_approval",
  );

  return <ApprovalsList initialTasks={awaitingApproval} />;
}
