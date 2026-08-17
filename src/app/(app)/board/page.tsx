import { redirect } from "next/navigation";
import { useTranslations } from "next-intl";

import { PageHeader } from "@/components/layout/page-header";
import { getCurrentUser } from "@/lib/auth/server";
import { fetchAssignableStaff, fetchBoardTasks } from "@/lib/board/queries";
import { can } from "@/lib/roles";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { fetchActiveWorkStages } from "@/lib/work-orders/queries";
import { ProductionBoard } from "./production-board";

export default async function BoardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (!can(user.role, "viewBoard")) {
    redirect("/");
  }

  const supabase = await createServerSupabaseClient();
  const [stages, tasks, staff] = await Promise.all([
    fetchActiveWorkStages(supabase, user.businessId),
    fetchBoardTasks(supabase, user.businessId),
    fetchAssignableStaff(supabase, user.businessId),
  ]);

  return (
    <BoardPageView
      stages={stages}
      tasks={tasks}
      staff={staff}
      canManageBoard={can(user.role, "manageBoard")}
      canApprove={can(user.role, "approveTasks")}
    />
  );
}

function BoardPageView({
  stages,
  tasks,
  staff,
  canManageBoard,
  canApprove,
}: {
  stages: Awaited<ReturnType<typeof fetchActiveWorkStages>>;
  tasks: Awaited<ReturnType<typeof fetchBoardTasks>>;
  staff: Awaited<ReturnType<typeof fetchAssignableStaff>>;
  canManageBoard: boolean;
  canApprove: boolean;
}) {
  const t = useTranslations("pages.board");

  return (
    <div>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <ProductionBoard
        stages={stages}
        initialTasks={tasks}
        staff={staff}
        canManageBoard={canManageBoard}
        canApprove={canApprove}
      />
    </div>
  );
}
