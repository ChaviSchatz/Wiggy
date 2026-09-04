"use client";

import { useMemo, useState } from "react";

import { PrimaryActionBar } from "@/components/domain/primary-action-bar";
import type { TaskStatus } from "@/lib/availability";
import type { HubData } from "@/lib/work-orders/hub-queries";
import type { IntakeResponseEntry } from "@/lib/work-orders/types";
import { AttachmentsSection } from "./attachments-section";
import { EditIntakeDialog } from "./edit-intake-dialog";
import { HistorySection } from "./history-section";
import {
  CancelOrderDialog,
  EditIntakeButton,
  HubHeader,
  isOrderFinal,
  MarkDeliveredDialog,
} from "./hub-header";
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

  // The stages this order's own tasks touch, plus the business's first and
  // last configured stage (intake and final handoff) so the stepper still
  // reads as "where is this order between received and delivered" -- not
  // just the isolated production steps it happens to have tasks in.
  const orderStages = useMemo(() => {
    const stageIds = new Set(data.tasks.map((task) => task.work_stage_id));
    const first = data.workStages[0];
    const last = data.workStages[data.workStages.length - 1];
    if (first) stageIds.add(first.id);
    if (last) stageIds.add(last.id);
    return data.workStages.filter((stage) => stageIds.has(stage.id));
  }, [data.tasks, data.workStages]);

  const { currentStageId, reachedStageIds } = useMemo(
    () => computeStageProgress(data.tasks, orderStages),
    [data.tasks, orderStages],
  );

  const isFinal = isOrderFinal(data.order.status);

  return (
    <div className="mx-auto max-w-4xl space-y-4 pb-12">
      <HubHeader order={data.order} />

      <ProgressStepper
        stages={orderStages}
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

      {permissions.canManageOrder ? (
        <PrimaryActionBar
          sticky
          secondary={
            <EditIntakeButton onClick={() => setEditIntakeOpen(true)} />
          }
          primary={
            data.order.status === "ready_for_handoff" ? (
              <MarkDeliveredDialog workOrderId={data.order.id} />
            ) : undefined
          }
          destructive={
            !isFinal ? (
              <CancelOrderDialog workOrderId={data.order.id} />
            ) : undefined
          }
        />
      ) : null}

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
  // No active task means every task is done/skipped/cancelled -- nothing is
  // "current" anymore, so the last stage should render as reached (green),
  // not as the current step (plum).
  const currentStageId = activeTask?.work_stage_id ?? null;
  const lastStageId = sorted[sorted.length - 1].work_stage_id;

  const referenceSortOrder =
    stages.find((s) => s.id === (currentStageId ?? lastStageId))?.sort_order ??
    0;
  const reachedStageIds = new Set(
    stages.filter((s) => s.sort_order <= referenceSortOrder).map((s) => s.id),
  );

  return { currentStageId, reachedStageIds };
}
