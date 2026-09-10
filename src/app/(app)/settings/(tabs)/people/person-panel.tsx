"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Briefcase,
  CheckCircle,
  Layers,
  Mail,
  Shield,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
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
import type { StageOption } from "./people-page-client";

const NO_VALUE = "__none__";

function FieldIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-md bg-fill-subtle text-muted">
      {children}
    </span>
  );
}

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

export function PersonPanel({
  stages,
  person,
  canManageAccess,
  onDone,
}: {
  stages: StageOption[];
  person?: PersonListItem;
  canManageAccess: boolean;
  onDone: () => void;
}) {
  const t = useTranslations("pages.settings.people");
  const router = useRouter();
  const [errors, setErrors] = useState<PersonFieldErrors>({});
  const [formError, setFormError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();
  const [stageId, setStageId] = useState(person?.default_work_stage_id ?? "");
  const [role, setRole] = useState("");

  const showAccess = canManageAccess && !person;

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
      onDone();
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

        <FormField
          label={
            <span className="flex items-center gap-2">
              <FieldIcon><User className="size-3.5" /></FieldIcon>
              {t("form.fullName")}
            </span>
          }
          htmlFor="panel-full-name"
          required
          error={errors.fullName ? t(`form.errors.${errors.fullName}`) : undefined}
        >
          <Input
            id="panel-full-name"
            name="fullName"
            defaultValue={person?.full_name ?? ""}
            required
            autoFocus
          />
        </FormField>

        <FormField
          label={
            <span className="flex items-center gap-2">
              <FieldIcon><Briefcase className="size-3.5" /></FieldIcon>
              {t("form.jobTitle")}
            </span>
          }
          htmlFor="panel-title"
        >
          <Input
            id="panel-title"
            name="title"
            defaultValue={person?.title ?? ""}
          />
        </FormField>

        <FormField
          label={
            <span className="flex items-center gap-2">
              <FieldIcon><Layers className="size-3.5" /></FieldIcon>
              {t("form.defaultStage")}
            </span>
          }
          htmlFor="panel-stage"
        >
          <SelectField
            id="panel-stage"
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

        <label className="flex items-start gap-3 text-body text-ink cursor-pointer rounded-lg border border-line bg-fill-subtle/50 px-3 py-2.5">
          <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-md bg-fill-subtle text-muted mt-0.5">
            <CheckCircle className="size-3.5" />
          </span>
          <span className="flex-1">
            {t("form.isAssignable")}
            <span className="block text-meta text-muted mt-0.5">
              {t("form.isAssignableHint")}
            </span>
          </span>
          <input
            type="checkbox"
            name="isAssignable"
            defaultChecked={person ? person.is_assignable : true}
            className="mt-1 size-4 rounded-xs border-line-strong text-mauve-600 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-mauve-100"
          />
        </label>

        {showAccess ? (
          <div className="rounded-lg border border-line bg-fill-subtle p-4 space-y-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-md bg-mauve-100 text-mauve-600">
                <Shield className="size-3.5" />
              </span>
              <div>
                <p className="text-body font-medium text-ink">
                  {t("form.accessSection")}
                </p>
                <p className="text-meta text-muted">
                  {t("form.accessHint")}
                </p>
              </div>
            </div>
            <FormField
              label={
                <span className="flex items-center gap-2">
                  <FieldIcon><Mail className="size-3.5" /></FieldIcon>
                  {t("form.email")}
                </span>
              }
              htmlFor="panel-email"
              error={errors.email ? t(`form.errors.${errors.email}`) : undefined}
            >
              <Input
                id="panel-email"
                name="email"
                type="email"
                dir="ltr"
              />
            </FormField>
            <FormField
              label={
                <span className="flex items-center gap-2">
                  <FieldIcon><Shield className="size-3.5" /></FieldIcon>
                  {t("form.role")}
                </span>
              }
              htmlFor="panel-role"
              error={errors.role ? t(`form.errors.${errors.role}`) : undefined}
            >
              <SelectField
                id="panel-role"
                name="role"
                value={role}
                onChange={setRole}
                placeholder={t("form.noRole")}
              >
                <SelectItem value={NO_VALUE}>{t("form.noRole")}</SelectItem>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {t(`roles.${r}`)}
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
      </div>

      <div className="border-t border-line px-5 py-4 flex items-center justify-end gap-3">
        <Button type="button" variant="outline" onClick={onDone}>
          {t("form.cancel")}
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? t("form.saving") : t("form.save")}
        </Button>
      </div>
    </form>
  );
}
