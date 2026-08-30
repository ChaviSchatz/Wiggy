"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ReturnForReworkDialog } from "@/components/tasks/return-for-rework-dialog";
import { approveTaskAction } from "@/lib/board/actions";
import type { BoardTask } from "@/lib/board/queries";

/**
 * ADR 0009's "approver = me" is business-wide in this v1: `runtime_tasks`
 * has no populated `approver_staff_member_id` anywhere yet (no UI ever
 * sets one -- task_types.requires_approval_default only flags *that* a
 * task needs approval, not *who* approves it), and the nav visibility
 * table doesn't distinguish between individual managers/admins either. So
 * this list is simply every `awaiting_approval` task, visible to anyone
 * with the `approveTasks` permission -- the same scope the board's inline
 * approve/return control already uses.
 */
export function ApprovalsList({ initialTasks }: { initialTasks: BoardTask[] }) {
  const t = useTranslations("pages.approvals");
  const router = useRouter();

  const [tasks, setTasks] = useState(initialTasks);
  const [returnTaskId, setReturnTaskId] = useState<string | null>(null);

  // Approving updates local state optimistically, but returning-for-rework
  // (a shared dialog) only calls `router.refresh()` -- resync from the
  // server-refetched prop so a returned task actually disappears from view.
  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  async function handleApprove(task: BoardTask) {
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    const result = await approveTaskAction(task.id);
    if (!result.success) {
      setTasks((prev) => [...prev, task]);
    }
  }

  return (
    <div>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      {tasks.length === 0 ? (
        <EmptyState
          title={t("emptyTitle")}
          description={t("emptyDescription")}
        />
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="bg-peach-100/20 flex flex-wrap items-center justify-between gap-3 rounded-card border border-peach-200 p-3"
            >
              <div>
                <p className="text-sm font-medium text-ink">
                  {task.customerName ?? task.templateName ?? ""}{" "}
                  <span className="font-normal text-muted">
                    #{task.orderNumber}
                  </span>
                  {" · "}
                  {task.title}
                </p>
                <p className="text-xs text-muted">
                  {t("submittedBy", {
                    name: task.assignedStaffMemberName ?? t("unknownStaff"),
                  })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setReturnTaskId(task.id)}
                >
                  {t("returnAction")}
                </Button>
                <Button size="sm" onClick={() => handleApprove(task)}>
                  {t("approveAction")}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ReturnForReworkDialog
        taskId={returnTaskId}
        open={returnTaskId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setReturnTaskId(null);
            router.refresh();
          }
        }}
      />
    </div>
  );
}
