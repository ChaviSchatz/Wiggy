"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormMessage } from "@/components/ui/form-message";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { editIntakeAction } from "@/lib/work-orders/actions";
import type { IntakeResponseEntry } from "@/lib/work-orders/types";

export function EditIntakeDialog({
  workOrderId,
  entries,
  open,
  onOpenChange,
}: {
  workOrderId: string;
  entries: IntakeResponseEntry[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("pages.orders.detail.hub.editIntake");
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(entries.map((e) => [e.itemId, e.value])),
  );
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  function handleSubmit() {
    const updated = entries.map((entry) => ({
      ...entry,
      value: values[entry.itemId] ?? entry.value,
    }));
    startTransition(async () => {
      const result = await editIntakeAction(workOrderId, updated);
      if (!result.success) {
        setError(result.error);
        return;
      }
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>
        {entries.length === 0 ? (
          <p className="text-sm text-muted">{t("empty")}</p>
        ) : (
          <div className="max-h-96 space-y-4 overflow-y-auto">
            {entries.map((entry) => (
              <div key={entry.itemId} className="space-y-1.5">
                <Label htmlFor={`intake-${entry.itemId}`}>{entry.label}</Label>
                <Textarea
                  id={`intake-${entry.itemId}`}
                  value={values[entry.itemId] ?? ""}
                  onChange={(e) =>
                    setValues((prev) => ({
                      ...prev,
                      [entry.itemId]: e.target.value,
                    }))
                  }
                />
              </div>
            ))}
          </div>
        )}
        {error ? (
          <FormMessage variant="error">{t("errors.generic")}</FormMessage>
        ) : null}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t("cancel")}
          </Button>
          {entries.length > 0 ? (
            <Button type="button" onClick={handleSubmit} disabled={pending}>
              {pending ? t("saving") : t("save")}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
