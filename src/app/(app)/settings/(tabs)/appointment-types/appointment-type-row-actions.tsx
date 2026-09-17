"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { setAppointmentTypeActiveAction } from "@/lib/appointment-types/actions";
import type { AppointmentType } from "@/lib/appointment-types/queries";
import { AppointmentTypeFormDialog } from "./appointment-type-form-dialog";

export function AppointmentTypeRowActions({ type }: { type: AppointmentType }) {
  const t = useTranslations("pages.settings.appointmentTypes");
  const router = useRouter();
  const [formError, setFormError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<{ success: boolean; formError?: string }>) {
    setFormError(undefined);
    startTransition(async () => {
      const result = await action();
      if (!result.success) {
        setFormError(result.formError ?? "generic");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <AppointmentTypeFormDialog
        type={type}
        trigger={<Button size="sm" variant="outline">{t("edit")}</Button>}
      />
      <Button
        size="sm"
        variant={type.is_active ? "danger-soft" : "outline"}
        disabled={pending}
        onClick={() => run(() => setAppointmentTypeActiveAction(type.id, !type.is_active))}
      >
        {type.is_active ? t("deactivate") : t("activate")}
      </Button>
      {formError ? <FormMessage variant="error">{t(`form.errors.${formError}`)}</FormMessage> : null}
    </div>
  );
}
