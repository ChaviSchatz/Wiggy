"use client";

import { useMemo, useState } from "react";

import type { TaskStatus } from "@/lib/availability";
import type { HubData } from "@/lib/work-orders/hub-queries";
import type { IntakeResponseEntry } from "@/lib/work-orders/types";
import { AttachmentsSection } from "./attachments-section";
import { EditIntakeDialog } from "./edit-intake-dialog";
import { HistorySection } from "./history-section";
import { HubHeader } from "./hub-header";
import { NotesSection } from "./notes-section";
import { ProgressStepper } from "./progress-stepper";
import { TaskSection } from "./task-section";
import { WarningsSection } from "./warnings-section";

const TERMINAL = new Set<TaskStatus>(["done", "skipped", "cancelled"]);

export type HubPermissions = {
  canManageOrder: boolean;
  canApprove: boolean;
  canWorkTasks: boolean;
  canManageBoard: boolean;
  canManageMissingItems: boolean;
};

export function WorkOrderHub({
  data,
  permissions,
}: {
  data: HubData;
  permissions: HubPermissions;
}) {
  const [editIntakeOpen, setEditIntakeOpen] = useState(false);

  const { currentStageId, reachedStageIds } = useMemo(
    () => computeStageProgress(data.tasks, data.workStages),
    [data.tasks, data.workStages],
  );

  return (
    <div className="mx-auto max-w-4xl space-y-4 pb-12">
      <HubHeader
        order={data.order}
        canManageOrder={permissions.canManageOrder}
        onEditIntake={() => setEditIntakeOpen(true)}
      />

      <ProgressStepper
        stages={data.workStages}
        currentStageId={currentStageId}
        reachedStageIds={reachedStageIds}
      />

      <WarningsSection
        missingItems={data.missingItems}
        canManageMissingItems={permissions.canManageMissingItems}
      />

      <TaskSection
        workOrderId={data.order.id}
        tasks={data.tasks}
        workStages={data.workStages}
        staff={data.staff}
        taskTypes={data.taskTypes}
        canWorkTasks={permissions.canWorkTasks}
        canApprove={permissions.canApprove}
        canManageBoard={permissions.canManageBoard}
        canManageOrder={permissions.canManageOrder}
      />

      <NotesSection
        workOrderId={data.order.id}
        notes={data.order.notes}
        comments={data.comments}
        tasks={data.tasks}
      />

      <AttachmentsSection
        workOrderId={data.order.id}
        attachments={data.attachments}
      />

      <HistorySection activity={data.activity} />

      <EditIntakeDialog
        workOrderId={data.order.id}
        entries={(data.order.intake_responses ?? []) as IntakeResponseEntry[]}
        open={editIntakeOpen}
        onOpenChange={setEditIntakeOpen}
      />
    </div>
  );
}

function computeStageProgress(
  tasks: HubData["tasks"],
  stages: HubData["workStages"],
): { currentStageId: string | null; reachedStageIds: Set<string> } {
  if (tasks.length === 0 || stages.length === 0) {
    return { currentStageId: null, reachedStageIds: new Set() };
  }

  const sorted = [...tasks].sort((a, b) => a.sequence_order - b.sequence_order);
  const activeTask = sorted.find(
    (task) => !TERMINAL.has(task.status as TaskStatus),
  );
  const currentStageId = (activeTask ?? sorted[sorted.length - 1])
    .work_stage_id;

  const currentSortOrder =
    stages.find((s) => s.id === currentStageId)?.sort_order ?? 0;
  const reachedStageIds = new Set(
    stages.filter((s) => s.sort_order <= currentSortOrder).map((s) => s.id),
  );

  return { currentStageId, reachedStageIds };
}
