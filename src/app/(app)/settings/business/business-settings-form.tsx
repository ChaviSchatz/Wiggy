"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setBusinessTimezoneAction } from "@/lib/business-settings/actions";
import { setSprintCadenceAction } from "@/lib/sprints/actions";

const CONTROL_CLASS =
  "h-[39px] w-full rounded-xs border border-line-strong bg-surface px-3 text-body text-ink focus-visible:border-mauve-600 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-mauve-100";

/**
 * Business settings (screen inventory #56). Each section owns its pending and
 * feedback state, so saving one never blanks the other, and each renders only
 * when the role may edit it.
 */
export function BusinessSettingsForm({
  timezone,
  cadenceDays,
  canEditTimezone,
  canEditCadence,
  timezones,
}: {
  timezone: string;
  cadenceDays: number;
  canEditTimezone: boolean;
  canEditCadence: boolean;
  timezones: string[];
}) {
  return (
    <div className="space-y-4">
      {canEditTimezone ? (
        <TimezoneSection timezone={timezone} timezones={timezones} />
      ) : null}
      {canEditCadence ? <CadenceSection cadenceDays={cadenceDays} /> : null}
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
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("label")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
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
      </CardContent>
    </Card>
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
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("label")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
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
      </CardContent>
    </Card>
  );
}
