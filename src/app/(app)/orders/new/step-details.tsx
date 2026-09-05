"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn, ltrIsolate } from "@/lib/utils";
import type { SprintOption } from "./wizard-types";

const NO_SPRINT = "__none__";

export function StepDetails({
  dueAt,
  priority,
  orderReceivedDate,
  notes,
  sprintId,
  sprintOptions,
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
  sprintId: string | null;
  sprintOptions: SprintOption[];
  onChange: (
    patch: Partial<{
      dueAt: string;
      priority: "normal" | "urgent";
      orderReceivedDate: string;
      notes: string;
      sprintId: string | null;
    }>,
  ) => void;
  onBack: () => void;
  onSubmit: () => void;
  submitting: boolean;
  error?: string;
}) {
  const t = useTranslations("pages.orders.wizard.details");
  const tSprintChip = useTranslations("pages.sprint");

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
        <Label htmlFor="order-sprint">{t("sprintLabel")}</Label>
        <Select
          value={sprintId ?? NO_SPRINT}
          onValueChange={(value) =>
            onChange({ sprintId: value === NO_SPRINT ? null : value })
          }
        >
          <SelectTrigger id="order-sprint">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_SPRINT}>{t("sprintNone")}</SelectItem>
            {sprintOptions.map((sprint) => (
              <SelectItem key={sprint.id} value={sprint.id}>
                {sprint.name ??
                  tSprintChip("sprintChip", {
                    range: ltrIsolate(
                      `${new Date(sprint.startsOn).toLocaleDateString("he-IL")} – ${new Date(sprint.endsOn).toLocaleDateString("he-IL")}`,
                    ),
                  })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-meta text-muted">{t("sprintHelp")}</p>
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
