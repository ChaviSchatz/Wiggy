"use client";

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
import { reassignTaskAction } from "@/lib/board/actions";
import type { AssignableStaffMember } from "@/lib/board/queries";
import type { BoardTask } from "@/lib/board/queries";

/** Tap-avatar reassignment (screen inventory #37, ADR 0010). */
export function AssigneePickerDialog({
  task,
  staff,
  onOpenChange,
  onReassigned,
}: {
  task: BoardTask | null;
  staff: AssignableStaffMember[];
  onOpenChange: (open: boolean) => void;
  onReassigned: (
    taskId: string,
    staffMemberId: string | null,
    staffName: string | null,
  ) => void;
}) {
  const t = useTranslations("pages.board.assignee");
  const [pending, startTransition] = useTransition();
  const [selectedId, setSelectedId] = useState<string | null>(
    task?.assigned_staff_member_id ?? null,
  );

  function handleOpenChange(open: boolean) {
    if (open && task) setSelectedId(task.assigned_staff_member_id);
    onOpenChange(open);
  }

  function handleSave() {
    if (!task) return;
    startTransition(async () => {
      const result = await reassignTaskAction(task.id, selectedId);
      if (result.success) {
        const staffName = selectedId
          ? (staff.find((s) => s.id === selectedId)?.full_name ?? null)
          : null;
        onReassigned(task.id, selectedId, staffName);
        onOpenChange(false);
      }
    });
  }

  return (
    <Dialog open={task !== null} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>

        <div className="max-h-64 space-y-1 overflow-y-auto">
          <label className="flex cursor-pointer items-center gap-2 rounded-control p-2 hover:bg-mauve-100">
            <input
              type="radio"
              name="assignee"
              checked={selectedId === null}
              onChange={() => setSelectedId(null)}
              className="accent-mauve-600"
            />
            <span className="text-sm">{t("unassign")}</span>
          </label>
          {staff.map((member) => (
            <label
              key={member.id}
              className="flex cursor-pointer items-center gap-2 rounded-control p-2 hover:bg-mauve-100"
            >
              <input
                type="radio"
                name="assignee"
                checked={selectedId === member.id}
                onChange={() => setSelectedId(member.id)}
                className="accent-mauve-600"
              />
              <span className="text-sm">{member.full_name}</span>
            </label>
          ))}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              {t("cancel")}
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleSave} disabled={pending}>
            {pending ? t("saving") : t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
