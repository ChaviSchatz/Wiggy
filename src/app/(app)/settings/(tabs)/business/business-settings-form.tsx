"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { BellRing, Building2, CalendarDays, Globe } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ReminderSettings } from "@/lib/appointments/queries";
import {
  setAppointmentReminderSettingsAction,
  setBusinessNameAction,
  setBusinessTimezoneAction,
} from "@/lib/business-settings/actions";
import { setSprintCadenceAction } from "@/lib/sprints/actions";

const CONTROL_CLASS =
  "h-[39px] w-full rounded-xs border border-line-strong bg-surface px-3 text-body text-ink focus-visible:border-mauve-600 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-mauve-100";

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 pb-3">
      <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-mauve-100 text-mauve-600">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-body font-medium text-ink leading-snug">{title}</p>
        <p className="text-meta text-muted mt-0.5">{description}</p>
      </div>
    </div>
  );
}

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
  reminderSettings,
  canEditName,
  canEditTimezone,
  canEditCadence,
  canEditReminders,
  timezones,
}: {
  businessName: string;
  timezone: string;
  cadenceDays: number;
  reminderSettings: ReminderSettings | null;
  canEditName: boolean;
  canEditTimezone: boolean;
  canEditCadence: boolean;
  canEditReminders: boolean;
  timezones: string[];
}) {
  if (!canEditName && !canEditTimezone && !canEditCadence && !canEditReminders) {
    return null;
  }

  return (
    <Card className="divide-y divide-line">
      {canEditName ? <NameSection name={businessName} /> : null}
      {canEditTimezone ? (
        <TimezoneSection timezone={timezone} timezones={timezones} />
      ) : null}
      {canEditCadence ? <CadenceSection cadenceDays={cadenceDays} /> : null}
      {canEditReminders && reminderSettings ? (
        <ReminderSection settings={reminderSettings} />
      ) : null}
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
      <SectionHeader
        icon={<Building2 className="size-4" />}
        title={t("label")}
        description={t("help")}
      />
      <div className="space-y-1.5">
        <Label htmlFor="business-name" className="sr-only">{t("label")}</Label>
        <Input
          id="business-name"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
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
      <SectionHeader
        icon={<Globe className="size-4" />}
        title={t("label")}
        description={t("help")}
      />
      <div className="space-y-1.5">
        <Label htmlFor="business-timezone" className="sr-only">{t("label")}</Label>
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
      const result = await setSprintCadenceAction(Number(value));
      setStatus(result.success ? "saved" : result.error);
      if (result.success) router.refresh();
    });
  }

  return (
    <div className="space-y-3 p-4">
      <SectionHeader
        icon={<CalendarDays className="size-4" />}
        title={t("label")}
        description={t("help")}
      />
      <div className="space-y-1.5">
        <Label htmlFor="sprint-cadence" className="sr-only">{t("label")}</Label>
        <Input
          id="sprint-cadence"
          type="number"
          min={1}
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
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

function ReminderSection({ settings }: { settings: ReminderSettings }) {
  const t = useTranslations("pages.settings.business.reminders");
  const router = useRouter();
  const [sendConfirmation, setSendConfirmation] = useState(settings.sendConfirmation);
  const [sendReminder, setSendReminder] = useState(settings.sendReminder);
  const [leadHours, setLeadHours] = useState(String(settings.reminderLeadHours));
  const [emailEnabled, setEmailEnabled] = useState(settings.emailEnabled);
  const [status, setStatus] = useState<"idle" | "saved" | string>("idle");
  const [pending, startTransition] = useTransition();

  function save() {
    setStatus("idle");
    startTransition(async () => {
      const result = await setAppointmentReminderSettingsAction({
        sendConfirmation,
        sendReminder,
        reminderLeadHours: Number(leadHours),
        emailEnabled,
        whatsappEnabled: false,
      });
      setStatus(result.success ? "saved" : result.error);
      if (result.success) router.refresh();
    });
  }

  return (
    <div className="space-y-3 p-4">
      <SectionHeader
        icon={<BellRing className="size-4" />}
        title={t("label")}
        description={t("help")}
      />

      <label className="flex items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          checked={sendConfirmation}
          onChange={(event) => setSendConfirmation(event.target.checked)}
          className="accent-mauve-600"
        />
        {t("sendConfirmation")}
      </label>

      <label className="flex items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          checked={sendReminder}
          onChange={(event) => setSendReminder(event.target.checked)}
          className="accent-mauve-600"
        />
        {t("sendReminder")}
      </label>

      {sendReminder ? (
        <div className="space-y-1.5 ps-6">
          <Label htmlFor="reminder-lead-hours" className="sr-only">
            {t("leadHours")}
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="reminder-lead-hours"
              type="number"
              min={1}
              value={leadHours}
              onChange={(event) => setLeadHours(event.target.value)}
              className="w-20"
            />
            <span className="text-sm text-muted">{t("leadHoursSuffix")}</span>
          </div>
        </div>
      ) : null}

      <label className="flex items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          checked={emailEnabled}
          onChange={(event) => setEmailEnabled(event.target.checked)}
          className="accent-mauve-600"
        />
        {t("emailEnabled")}
      </label>

      {/* WhatsApp: shown disabled, explaining why -- no provider is wired up
          yet (design spec, "Customer reminders"). */}
      <label className="flex items-center gap-2 text-sm text-muted">
        <input type="checkbox" checked={false} disabled className="accent-mauve-600" />
        {t("whatsappEnabled")}
        <span className="text-meta">({t("whatsappComingSoon")})</span>
      </label>

      {status === "saved" ? (
        <FormMessage variant="success">{t("saved")}</FormMessage>
      ) : status !== "idle" ? (
        <FormMessage variant="error">{t(`errors.${status}`)}</FormMessage>
      ) : null}

      <Button onClick={save} disabled={pending}>
        {pending ? t("saving") : t("save")}
      </Button>
    </div>
  );
}
