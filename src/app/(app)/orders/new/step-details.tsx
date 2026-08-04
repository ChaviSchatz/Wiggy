"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function StepDetails({
  dueAt,
  priority,
  orderReceivedDate,
  notes,
  onChange,
  onBack,
  onSubmit,
  submitting,
  error,
}: {
  dueAt: string;
  priority: "normal" | "urgent";
  orderReceivedDate: string;
  notes: string;
  onChange: (
    patch: Partial<{
      dueAt: string;
      priority: "normal" | "urgent";
      orderReceivedDate: string;
      notes: string;
    }>,
  ) => void;
  onBack: () => void;
  onSubmit: () => void;
  submitting: boolean;
  error?: string;
}) {
  const t = useTranslations("pages.orders.wizard.details");

  return (
    <div className="space-y-4">
      {error ? (
        <FormMessage variant="error">{t(`errors.${error}`)}</FormMessage>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="order-received-date">
            {t("orderReceivedDateLabel")}
          </Label>
          <Input
            id="order-received-date"
            type="date"
            value={orderReceivedDate}
            onChange={(event) =>
              onChange({ orderReceivedDate: event.target.value })
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="due-at">{t("dueAtLabel")}</Label>
          <Input
            id="due-at"
            type="date"
            value={dueAt}
            onChange={(event) => onChange({ dueAt: event.target.value })}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>{t("priorityLabel")}</Label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onChange({ priority: "normal" })}
            className={cn(
              "rounded-control border px-4 py-2 text-sm",
              priority === "normal"
                ? "border-mauve-600 bg-mauve-100 text-mauve-600"
                : "border-line text-muted",
            )}
          >
            {t("priorityNormal")}
          </button>
          <button
            type="button"
            onClick={() => onChange({ priority: "urgent" })}
            className={cn(
              "rounded-control border px-4 py-2 text-sm",
              priority === "urgent"
                ? "border-peach-500 bg-peach-100 text-danger-600"
                : "border-line text-muted",
            )}
          >
            {t("priorityUrgent")}
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="order-notes">{t("notesLabel")}</Label>
        <Textarea
          id="order-notes"
          value={notes}
          onChange={(event) => onChange({ notes: event.target.value })}
        />
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={submitting}>
          {t("back")}
        </Button>
        <Button onClick={onSubmit} disabled={submitting}>
          {submitting ? t("confirming") : t("confirm")}
        </Button>
      </div>
    </div>
  );
}
