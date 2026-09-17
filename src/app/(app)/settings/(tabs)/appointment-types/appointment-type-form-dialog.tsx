"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createAppointmentTypeAction,
  updateAppointmentTypeAction,
} from "@/lib/appointment-types/actions";
import type { AppointmentType } from "@/lib/appointment-types/queries";
import { type AppointmentTypeFieldErrors } from "@/lib/appointment-types/validation";

export function AppointmentTypeFormDialog({
  type,
  trigger,
}: {
  type?: AppointmentType;
  trigger?: React.ReactNode;
}) {
  const t = useTranslations("pages.settings.appointmentTypes");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<AppointmentTypeFieldErrors>({});
  const [formError, setFormError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setErrors({});
      setFormError(undefined);
    }
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setErrors({});
    setFormError(undefined);

    startTransition(async () => {
      const result = type
        ? await updateAppointmentTypeAction(type.id, formData)
        : await createAppointmentTypeAction(formData);

      if (!result.success) {
        setErrors(result.errors);
        setFormError(result.formError);
        return;
      }

      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" className="gap-2">
            <Plus className="size-4" aria-hidden />
            {t("add")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{type ? t("form.editTitle") : t("form.createTitle")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="appointment-type-name">{t("form.name")}</Label>
            <Input
              id="appointment-type-name"
              name="name"
              defaultValue={type?.name ?? ""}
              required
            />
            {errors.name ? (
              <FormMessage variant="error">{t(`form.errors.${errors.name}`)}</FormMessage>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="appointment-type-duration">{t("form.duration")}</Label>
            <Input
              id="appointment-type-duration"
              name="defaultDurationMinutes"
              type="number"
              min={1}
              defaultValue={type?.default_duration_minutes ?? ""}
            />
            {errors.defaultDurationMinutes ? (
              <FormMessage variant="error">
                {t(`form.errors.${errors.defaultDurationMinutes}`)}
              </FormMessage>
            ) : null}
          </div>

          {formError ? (
            <FormMessage variant="error">{t(`form.errors.${formError}`)}</FormMessage>
          ) : null}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">{t("form.cancel")}</Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? t("form.saving") : t("form.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
