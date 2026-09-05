"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  setBusinessNameAction,
  setBusinessTimezoneAction,
} from "@/lib/business-settings/actions";
import { setSprintCadenceAction } from "@/lib/sprints/actions";

const CONTROL_CLASS =
  "h-[39px] w-full rounded-xs border border-line-strong bg-surface px-3 text-body text-ink focus-visible:border-mauve-600 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-mauve-100";

/**
 * Business settings (screen inventory #56). One card, not three -- these are
 * facets of the same tenant-identity/operations settings, so they read as
 * one panel with a divider between fields rather than three separate boxes
 * of uneven height. Each section still owns its own pending and feedback
 * state, so saving one never blanks another, and each renders only when the
 * role may edit it.
 */
export function BusinessSettingsForm({
  businessName,
  timezone,
  cadenceDays,
  canEditName,
  canEditTimezone,
  canEditCadence,
  timezones,
}: {
  businessName: string;
  timezone: string;
  cadenceDays: number;
  canEditName: boolean;
  canEditTimezone: boolean;
  canEditCadence: boolean;
  timezones: string[];
}) {
  if (!canEditName && !canEditTimezone && !canEditCadence) return null;

  return (
    <Card className="divide-y divide-line">
      {canEditName ? <NameSection name={businessName} /> : null}
      {canEditTimezone ? (
        <TimezoneSection timezone={timezone} timezones={timezones} />
      ) : null}
      {canEditCadence ? <CadenceSection cadenceDays={cadenceDays} /> : null}
    </Card>
  );
}

function NameSection({ name }: { name: string }) {
  const t = useTranslations("pages.settings.business.name");
  const router = useRouter();
  const [value, setValue] = useState(name);
  const [status, setStatus] = useState<"idle" | "saved" | string>("idle");
  const [pending, startTransition] = useTransition();

  function save() {
    setStatus("idle");
    startTransition(async () => {
      const result = await setBusinessNameAction(value);
      setStatus(result.success ? "saved" : result.error);
      if (result.success) router.refresh();
    });
  }

  return (
    <div className="space-y-3 p-4">
      <div className="space-y-1.5">
        <Label htmlFor="business-name">{t("label")}</Label>
        <Input
          id="business-name"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
        <p className="text-meta text-muted">{t("help")}</p>
      </div>

      {status === "saved" ? (
        <FormMessage variant="success">{t("saved")}</FormMessage>
      ) : status !== "idle" ? (
        <FormMessage variant="error">{t(`errors.${status}`)}</FormMessage>
      ) : null}

      <Button
        onClick={save}
        disabled={pending || !value.trim() || value === name}
      >
        {pending ? t("saving") : t("save")}
      </Button>
    </div>
  );
}

function TimezoneSection({
  timezone,
  timezones,
}: {
  timezone: string;
  timezones: string[];
}) {
  const t = useTranslations("pages.settings.business.timezone");
  const router = useRouter();
  const [value, setValue] = useState(timezone);
  const [status, setStatus] = useState<"idle" | "saved" | string>("idle");
  const [pending, startTransition] = useTransition();

  function save() {
    setStatus("idle");
    startTransition(async () => {
      const result = await setBusinessTimezoneAction(value);
      setStatus(result.success ? "saved" : result.error);
      if (result.success) router.refresh();
    });
  }

  return (
    <div className="space-y-3 p-4">
      <div className="space-y-1.5">
        <Label htmlFor="business-timezone">{t("label")}</Label>
        <select
          id="business-timezone"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className={CONTROL_CLASS}
        >
          {timezones.map((zone) => (
            <option key={zone} value={zone}>
              {zone}
            </option>
          ))}
        </select>
        <p className="text-meta text-muted">{t("help")}</p>
      </div>

      {status === "saved" ? (
        <FormMessage variant="success">{t("saved")}</FormMessage>
      ) : status !== "idle" ? (
        <FormMessage variant="error">{t(`errors.${status}`)}</FormMessage>
      ) : null}

      <Button onClick={save} disabled={pending || value === timezone}>
        {pending ? t("saving") : t("save")}
      </Button>
    </div>
  );
}

function CadenceSection({ cadenceDays }: { cadenceDays: number }) {
  const t = useTranslations("pages.settings.business.cadence");
  const router = useRouter();
  const [value, setValue] = useState(String(cadenceDays));
  const [status, setStatus] = useState<"idle" | "saved" | string>("idle");
  const [pending, startTransition] = useTransition();

  function save() {
    setStatus("idle");
    startTransition(async () => {
      // Same action the sprint header uses -- one action, two call sites.
      const result = await setSprintCadenceAction(Number(value));
      setStatus(result.success ? "saved" : result.error);
      if (result.success) router.refresh();
    });
  }

  return (
    <div className="space-y-3 p-4">
      <div className="space-y-1.5">
        <Label htmlFor="sprint-cadence">{t("label")}</Label>
        <Input
          id="sprint-cadence"
          type="number"
          min={1}
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
        <p className="text-meta text-muted">{t("help")}</p>
      </div>

      {status === "saved" ? (
        <FormMessage variant="success">{t("saved")}</FormMessage>
      ) : status !== "idle" ? (
        <FormMessage variant="error">{t(`errors.${status}`)}</FormMessage>
      ) : null}

      <Button
        onClick={save}
        disabled={pending || value === String(cadenceDays)}
      >
        {pending ? t("saving") : t("save")}
      </Button>
    </div>
  );
}
