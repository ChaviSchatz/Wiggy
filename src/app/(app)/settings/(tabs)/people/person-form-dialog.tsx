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
import { FormField } from "@/components/ui/form-field";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createPersonAction, updatePersonAction } from "@/lib/people/actions";
import type { PersonListItem } from "@/lib/people/queries";
import type { PersonFieldErrors } from "@/lib/people/validation";
import { ROLES } from "@/lib/roles";

export type StageOption = { id: string; name: string };

const NO_VALUE = "__none__";

/**
 * Radix `Select` is not a native form control, so it carries its value in a
 * hidden input -- the form still submits as plain `FormData`, exactly like
 * every other dialog in the app.
 */
function SelectField({
  name,
  value,
  onChange,
  placeholder,
  children,
  id,
}: {
  name: string;
  value: string;
  onChange: (next: string) => void;
  placeholder: string;
  children: React.ReactNode;
  id: string;
}) {
  return (
    <>
      <input type="hidden" name={name} value={value} />
      <Select
        value={value || NO_VALUE}
        onValueChange={(next) => onChange(next === NO_VALUE ? "" : next)}
      >
        <SelectTrigger id={id}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
    </>
  );
}

/**
 * Create/edit a person (ADR 0013). Same shape as the dialogs it replaces:
 * `FormData` submit, field errors keyed to the message catalog,
 * `router.refresh()` on success.
 *
 * The access section only renders for someone who may grant a login, so a
 * manager gets a plain three-field roster form rather than a form with a dead
 * half. Granting access on *edit* is a row action, not part of this form --
 * changing a name and changing who can sign in are different decisions.
 */
export function PersonFormDialog({
  stages,
  person,
  canManageAccess,
  trigger,
}: {
  stages: StageOption[];
  person?: PersonListItem;
  canManageAccess: boolean;
  trigger?: React.ReactNode;
}) {
  const t = useTranslations("pages.settings.people");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<PersonFieldErrors>({});
  const [formError, setFormError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();
  const [stageId, setStageId] = useState(person?.default_work_stage_id ?? "");
  const [role, setRole] = useState("");

  const showAccess = canManageAccess && !person;

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setErrors({});
      setFormError(undefined);
      setStageId(person?.default_work_stage_id ?? "");
      setRole("");
    }
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setErrors({});
    setFormError(undefined);

    startTransition(async () => {
      const result = person
        ? await updatePersonAction(person.id, formData)
        : await createPersonAction(formData);

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
            {person ? t("form.editTitle") : t("form.createTitle")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <FormField
            label={t("form.fullName")}
            htmlFor="person-full-name"
            required
            error={
              errors.fullName ? t(`form.errors.${errors.fullName}`) : undefined
            }
          >
            <Input
              id="person-full-name"
              name="fullName"
              defaultValue={person?.full_name ?? ""}
              required
            />
          </FormField>

          <FormField label={t("form.jobTitle")} htmlFor="person-title">
            <Input
              id="person-title"
              name="title"
              defaultValue={person?.title ?? ""}
            />
          </FormField>

          <FormField label={t("form.defaultStage")} htmlFor="person-stage">
            <SelectField
              id="person-stage"
              name="defaultWorkStageId"
              value={stageId}
              onChange={setStageId}
              placeholder={t("form.noStage")}
            >
              <SelectItem value={NO_VALUE}>{t("form.noStage")}</SelectItem>
              {stages.map((stage) => (
                <SelectItem key={stage.id} value={stage.id}>
                  {stage.name}
                </SelectItem>
              ))}
            </SelectField>
          </FormField>

          <label className="flex items-start gap-2 text-body text-ink">
            <input
              type="checkbox"
              name="isAssignable"
              defaultChecked={person ? person.is_assignable : true}
              className="mt-1 size-4 rounded-xs border-line-strong text-mauve-600 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-mauve-100"
            />
            <span>
              {t("form.isAssignable")}
              <span className="block text-meta text-muted">
                {t("form.isAssignableHint")}
              </span>
            </span>
          </label>

          {showAccess ? (
            <div className="space-y-3 rounded-xs border border-line p-3">
              <div>
                <p className="text-section text-ink">
                  {t("form.accessSection")}
                </p>
                <p className="text-meta text-muted">{t("form.accessHint")}</p>
              </div>

              <FormField
                label={t("form.email")}
                htmlFor="person-email"
                error={
                  errors.email ? t(`form.errors.${errors.email}`) : undefined
                }
              >
                <Input id="person-email" name="email" type="email" dir="ltr" />
              </FormField>

              <FormField
                label={t("form.role")}
                htmlFor="person-role"
                error={
                  errors.role ? t(`form.errors.${errors.role}`) : undefined
                }
              >
                <SelectField
                  id="person-role"
                  name="role"
                  value={role}
                  onChange={setRole}
                  placeholder={t("form.noRole")}
                >
                  <SelectItem value={NO_VALUE}>{t("form.noRole")}</SelectItem>
                  {ROLES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {t(`roles.${value}`)}
                    </SelectItem>
                  ))}
                </SelectField>
              </FormField>
            </div>
          ) : null}

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
