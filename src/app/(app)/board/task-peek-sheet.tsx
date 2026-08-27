"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { StatusChip } from "@/components/domain/status-chip";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Availability } from "@/lib/availability";
import type { BoardTask } from "@/lib/board/queries";

const STARTABLE = new Set(["pending", "returned_for_rework"]);

/** Design-system "H. Drawer/Peek": quick glance + quick actions, not the full hub. */
export function TaskPeekSheet({
  task,
  availability,
  onOpenChange,
  onStart,
  onComplete,
}: {
  task: BoardTask | null;
  availability: Availability | undefined;
  onOpenChange: (open: boolean) => void;
  onStart: (task: BoardTask) => void;
  onComplete: (task: BoardTask) => void;
}) {
  const t = useTranslations("pages.board");
  const tKind = useTranslations("pages.orders.kind");
  const tTaskStatus = useTranslations("pages.orders.taskStatus");

  const identity = task ? (task.customerName ?? tKind(task.orderKind)) : "";

  return (
    <Sheet open={task !== null} onOpenChange={onOpenChange}>
      <SheetContent>
        {task ? (
          <>
            <SheetHeader>
              <SheetTitle>{task.title}</SheetTitle>
              <SheetDescription>
                {identity} · #{task.orderNumber}
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted">{t("peek.status")}</span>
                <StatusChip
                  kind="task"
                  status={task.status}
                  label={tTaskStatus(task.status)}
                />
              </div>
              {availability === "blocked" ? (
                <div className="flex items-center justify-between">
                  <span className="text-muted">{t("peek.availability")}</span>
                  <StatusChip
                    kind="availability"
                    status="blocked"
                    label={t("blocked")}
                  />
                </div>
              ) : null}
              <div className="flex items-center justify-between">
                <span className="text-muted">{t("peek.assignee")}</span>
                <span className="flex items-center gap-2">
                  <Avatar name={task.assignedStaffMemberName} size="sm" />
                  {task.assignedStaffMemberName ?? t("peek.unassigned")}
                </span>
              </div>
              {task.requires_approval ? (
                <div className="flex items-center justify-between">
                  <span className="text-muted">
                    {t("peek.requiresApproval")}
                  </span>
                  <Badge variant="warning">{t("peek.yes")}</Badge>
                </div>
              ) : null}
              {task.description ? (
                <div>
                  <p className="text-muted">{t("peek.description")}</p>
                  <p className="text-ink">{task.description}</p>
                </div>
              ) : null}
              {task.production_notes ? (
                <div>
                  <p className="text-muted">{t("peek.productionNotes")}</p>
                  <p className="text-ink">{task.production_notes}</p>
                </div>
              ) : null}
            </div>

            <div className="mt-6 flex flex-col gap-2">
              {availability !== "blocked" && STARTABLE.has(task.status) ? (
                <Button onClick={() => onStart(task)}>{t("start")}</Button>
              ) : null}
              {task.status === "in_progress" ? (
                <Button onClick={() => onComplete(task)}>{t("done")}</Button>
              ) : null}
              <Button variant="outline" asChild>
                <Link href={`/orders/${task.work_order_id}`}>
                  {t("peek.openOrder")}
                </Link>
              </Button>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
