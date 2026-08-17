"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  closeSprintAction,
  createSprintAction,
  setSprintCadenceAction,
} from "@/lib/sprints/actions";
import type { Sprint } from "@/lib/sprints/queries";

const CADENCE_OPTIONS = [2, 7, 14];

export function SprintHeader({
  sprint,
  cadenceDays,
  openTaskCount,
}: {
  sprint: Sprint | null;
  cadenceDays: number;
  openTaskCount: number;
}) {
  const t = useTranslations("pages.sprint");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [cadence, setCadence] = useState(cadenceDays);

  function handleCreate() {
    startTransition(async () => {
      await createSprintAction();
      router.refresh();
    });
  }

  function handleClose() {
    if (!sprint) return;
    startTransition(async () => {
      await closeSprintAction(sprint.id);
      router.refresh();
    });
  }

  function handleCadenceChange(days: number) {
    setCadence(days);
    startTransition(async () => {
      await setSprintCadenceAction(days);
      router.refresh();
    });
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <h1 className="text-2xl font-bold text-ink">{t("title")}</h1>

      {sprint ? (
        <span className="rounded-control border border-mauve-200 bg-mauve-100 px-3 py-1.5 text-xs font-medium text-mauve-600">
          {t("sprintChip", {
            start: new Date(sprint.starts_on).toLocaleDateString("he-IL"),
            end: new Date(sprint.ends_on).toLocaleDateString("he-IL"),
          })}
        </span>
      ) : (
        <span className="rounded-control border border-dashed border-line px-3 py-1.5 text-xs text-muted">
          {t("noActiveSprint")}
        </span>
      )}

      <label className="flex items-center gap-1.5 text-xs text-muted">
        {t("cadenceLabel")}
        <select
          value={cadence}
          onChange={(event) => handleCadenceChange(Number(event.target.value))}
          disabled={pending}
          className="h-8 rounded-control border border-line bg-surface px-2 text-xs text-ink"
        >
          {CADENCE_OPTIONS.map((days) => (
            <option key={days} value={days}>
              {days === 2 ? t("cadenceDaysDual") : t("cadenceDays", { count: days })}
            </option>
          ))}
        </select>
      </label>

      {sprint ? (
        <Button size="sm" variant="outline" onClick={handleClose} disabled={pending}>
          {t("closeSprint")}
        </Button>
      ) : (
        <Button size="sm" onClick={handleCreate} disabled={pending}>
          {t("createSprint")}
        </Button>
      )}

      <span className="ms-auto text-xs text-muted">
        {t("openTasksCount", { count: openTaskCount })}
      </span>
    </div>
  );
}
