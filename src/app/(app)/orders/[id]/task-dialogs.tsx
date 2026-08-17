"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormMessage } from "@/components/ui/form-message";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addManualTaskAction } from "@/lib/work-orders/actions";
import type { Tables } from "@/lib/supabase/database.types";

const selectClass =
  "h-10 w-full rounded-control border border-line bg-surface px-3 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/** Add manual / "Other" task (screen inventory #25). */
export function AddTaskDialog({
  workOrderId,
  taskTypes,
  workStages,
  open,
  onOpenChange,
}: {
  workOrderId: string;
  taskTypes: Tables<"task_types">[];
  workStages: Tables<"work_stages">[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("pages.orders.detail.hub.tasks");
  const router = useRouter();
  const [taskTypeId, setTaskTypeId] = useState<string>("");
  const [otherTitle, setOtherTitle] = useState("");
  const [workStageId, setWorkStageId] = useState<string>(
    workStages[0]?.id ?? "",
  );
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  function handleOpenChange(next: boolean) {
    if (!next) {
      setTaskTypeId("");
      setOtherTitle("");
      setError(undefined);
    }
    onOpenChange(next);
  }

  function handleSubmit() {
    startTransition(async () => {
      const result = await addManualTaskAction({
        workOrderId,
        taskTypeId: taskTypeId || null,
        otherTitle: taskTypeId ? undefined : otherTitle,
        workStageId,
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      handleOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("addTaskTitle")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="add-task-type">{t("addTaskTypeLabel")}</Label>
            <select
              id="add-task-type"
              className={selectClass}
              value={taskTypeId}
              onChange={(e) => setTaskTypeId(e.target.value)}
            >
              <option value="">{t("addTaskOtherOption")}</option>
              {taskTypes.map((taskType) => (
                <option key={taskType.id} value={taskType.id}>
                  {taskType.name}
                </option>
              ))}
            </select>
          </div>
          {!taskTypeId ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="add-task-other-title">
                  {t("addTaskOtherTitleLabel")}
                </Label>
                <Textarea
                  id="add-task-other-title"
                  value={otherTitle}
                  onChange={(e) => setOtherTitle(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="add-task-work-stage">
                  {t("addTaskWorkStageLabel")}
                </Label>
                <select
                  id="add-task-work-stage"
                  className={selectClass}
                  value={workStageId}
                  onChange={(e) => setWorkStageId(e.target.value)}
                >
                  {workStages.map((stage) => (
                    <option key={stage.id} value={stage.id}>
                      {stage.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : null}
        </div>
        {error ? (
          <FormMessage variant="error">{t("errors.generic")}</FormMessage>
        ) : null}
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              {t("cancel")}
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleSubmit} disabled={pending}>
            {pending ? t("saving") : t("addTaskAction")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
