import { notFound, redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/server";
import { can } from "@/lib/roles";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getHubData } from "@/lib/work-orders/hub-queries";
import { WorkOrderHub } from "./work-order-hub";

/**
 * Full-page Work-Order Hub (Slice 6, docs/ui/work-order-hub.md). Open to
 * every role that can see the board (`viewBoard` spans all four roles) --
 * the board peek's "open full order" link (Slice 5) must resolve for a
 * worker, not just office roles. Individual actions below are gated more
 * narrowly, permission by permission, inside `WorkOrderHub`.
 */
export default async function OrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (!can(user.role, "viewBoard")) {
    redirect("/");
  }

  const supabase = await createServerSupabaseClient();
  const data = await getHubData(supabase, user.businessId, params.id);
  if (!data) {
    notFound();
  }

  return (
    <WorkOrderHub
      data={data}
      permissions={{
        canManageOrder: can(user.role, "createOrders"),
        canApprove: can(user.role, "approveTasks"),
        canWorkTasks: can(user.role, "workOwnTasks"),
        canManageBoard: can(user.role, "manageBoard"),
        canManageMissingItems: can(user.role, "manageMissingItems"),
      }}
    />
  );
}
