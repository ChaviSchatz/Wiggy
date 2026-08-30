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
  createStaffMemberAction,
  updateStaffMemberAction,
} from "@/lib/staff/actions";
import type { StaffListItem } from "@/lib/staff/queries";
import type { StaffFieldErrors } from "@/lib/staff/validation";

export type StageOption = { id: string; name: string };

/**
 * Create/edit a staff member (screen inventory #53). Same shape as
 * `CustomerFormDialog`: `FormData` submit, field errors keyed to the message
 * catalog, `router.refresh()` on success.
 *
 * `user_id` is deliberately absent -- linking a login to a staff member is
 * screen #54 and needs invite/auth flows.
 */
export function StaffFormDialog({
  stages,
  member,
  trigger,
}: {
  stages: StageOption[];
  member?: StaffListItem;
  trigger?: React.ReactNode;
}) {
  const t = useTranslations("pages.settings.staff");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<StaffFieldErrors>({});
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
      const result = member
        ? await updateStaffMemberAction(member.id, formData)
        : await createStaffMemberAction(formData);

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
          <DialogTitle>
            {member ? t("form.editTitle") : t("form.createTitle")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="staff-full-name">{t("form.fullName")}</Label>
            <Input
              id="staff-full-name"
              name="fullName"
              defaultValue={member?.full_name ?? ""}
              required
            />
            {errors.fullName ? (
              <FormMessage variant="error">
                {t(`form.errors.${errors.fullName}`)}
              </FormMessage>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="staff-title">{t("form.jobTitle")}</Label>
            <Input
              id="staff-title"
              name="title"
              defaultValue={member?.title ?? ""}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="staff-stage">{t("form.defaultStage")}</Label>
            <select
              id="staff-stage"
              name="defaultWorkStageId"
              defaultValue={member?.default_work_stage_id ?? ""}
              className="h-[39px] w-full rounded-xs border border-line-strong bg-surface px-3 text-body text-ink focus-visible:border-mauve-600 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-mauve-100"
            >
              <option value="">{t("form.noStage")}</option>
              {stages.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.name}
                </option>
              ))}
            </select>
          </div>

          {formError ? (
            <FormMessage variant="error">
              {t(`form.errors.${formError}`)}
            </FormMessage>
          ) : null}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                {t("form.cancel")}
              </Button>
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
