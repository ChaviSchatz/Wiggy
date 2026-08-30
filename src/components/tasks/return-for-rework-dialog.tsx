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
import { returnTaskForReworkAction } from "@/lib/board/actions";

/** Shared between the board card and the hub's task list (ADR 0009). */
export function ReturnForReworkDialog({
  taskId,
  open,
  onOpenChange,
}: {
  taskId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("pages.board");
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  function handleOpenChange(next: boolean) {
    if (!next) {
      setReason("");
      setError(undefined);
    }
    onOpenChange(next);
  }

  function handleSubmit() {
    if (!taskId) return;
    startTransition(async () => {
      const result = await returnTaskForReworkAction(taskId, reason);
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
          <DialogTitle>{t("returnDialog.title")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="return-reason">{t("returnDialog.reasonLabel")}</Label>
          <Textarea
            id="return-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />
        </div>
        {error ? (
          <FormMessage variant="error">
            {t(
              error === "reasonRequired"
                ? "returnDialog.errors.reasonRequired"
                : "returnDialog.errors.generic",
            )}
          </FormMessage>
        ) : null}
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              {t("returnDialog.cancel")}
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="danger"
            onClick={handleSubmit}
            disabled={pending}
          >
            {pending ? t("returnDialog.saving") : t("returnDialog.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
