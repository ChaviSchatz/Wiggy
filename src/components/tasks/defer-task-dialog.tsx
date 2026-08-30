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
import { deferTaskAction } from "@/lib/board/actions";

const inputClass =
  "h-10 w-full rounded-control border border-line bg-surface px-3 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/** Manual pause with reason + resume date (screen inventory #38). */
export function DeferTaskDialog({
  taskId,
  open,
  onOpenChange,
}: {
  taskId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("pages.orders.detail.hub.tasks");
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [resumeDate, setResumeDate] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  function handleOpenChange(next: boolean) {
    if (!next) {
      setReason("");
      setResumeDate("");
      setError(undefined);
    }
    onOpenChange(next);
  }

  function handleSubmit() {
    if (!taskId) return;
    startTransition(async () => {
      const result = await deferTaskAction(taskId, reason, resumeDate || null);
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
          <DialogTitle>{t("deferTitle")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="defer-reason">{t("deferReasonLabel")}</Label>
            <Textarea
              id="defer-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="defer-resume-date">
              {t("deferResumeDateLabel")}
            </Label>
            <input
              id="defer-resume-date"
              type="date"
              value={resumeDate}
              onChange={(e) => setResumeDate(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
        {error ? (
          <FormMessage variant="error">
            {t(
              error === "reasonRequired"
                ? "errors.reasonRequired"
                : "errors.generic",
            )}
          </FormMessage>
        ) : null}
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              {t("cancel")}
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleSubmit} disabled={pending}>
            {pending ? t("saving") : t("deferAction")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
