"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Mail, Shield } from "lucide-react";

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
import {
  changeRoleAction,
  correctEmailAction,
  invitePersonAction,
} from "@/lib/people/actions";
import type { PersonListItem } from "@/lib/people/queries";
import type { PersonFieldErrors } from "@/lib/people/validation";
import { ROLES, type Role } from "@/lib/roles";
import type { PanelState } from "./people-page-client";

type AccessPanelKind = Exclude<PanelState["kind"], "create" | "edit">;

function FieldIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-md bg-fill-subtle text-muted">
      {children}
    </span>
  );
}

function useSubmit() {
  const router = useRouter();
  const [errors, setErrors] = useState<PersonFieldErrors>({});
  const [formError, setFormError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  function run(
    action: () => Promise<
      | { success: true }
      | { success: false; errors: PersonFieldErrors; formError?: string }
    >,
    onDone: () => void,
  ) {
    setErrors({});
    setFormError(undefined);
    startTransition(async () => {
      const result = await action();
      if (!result.success) {
        setErrors(result.errors);
        setFormError(result.formError);
        return;
      }
      onDone();
      router.refresh();
    });
  }

  return { errors, formError, pending, run };
}

function RoleSelect({
  value,
  onChange,
  id,
}: {
  value: string;
  onChange: (next: string) => void;
  id: string;
}) {
  const t = useTranslations("pages.settings.people");
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ROLES.map((role) => (
          <SelectItem key={role} value={role}>
            {t(`roles.${role}`)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Routes to the correct inline form based on the panel action. */
export function AccessPanel({
  kind,
  person,
  onDone,
}: {
  kind: AccessPanelKind;
  person: PersonListItem;
  onDone: () => void;
}) {
  if (kind === "invite") return <InvitePanel person={person} onDone={onDone} />;
  if (kind === "correctEmail")
    return <CorrectEmailPanel person={person} onDone={onDone} />;
  return <ChangeRolePanel person={person} onDone={onDone} />;
}

function InvitePanel({
  person,
  onDone,
}: {
  person: PersonListItem;
  onDone: () => void;
}) {
  const t = useTranslations("pages.settings.people");
  const [role, setRole] = useState<string>("worker");
  const { errors, formError, pending, run } = useSubmit();

  return (
    <form
      className="flex flex-col flex-1 min-h-0"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        run(() => invitePersonAction(person.id, formData), onDone);
      }}
    >
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        <p className="text-body text-muted">{t("invite.description")}</p>

        <FormField
          label={
            <span className="flex items-center gap-2">
              <FieldIcon><Mail className="size-3.5" /></FieldIcon>
              {t("form.email")}
            </span>
          }
          htmlFor="access-email"
          required
          error={errors.email ? t(`form.errors.${errors.email}`) : undefined}
        >
          <Input
            id="access-email"
            name="email"
            type="email"
            dir="ltr"
            required
            autoFocus
          />
        </FormField>

        <FormField
          label={
            <span className="flex items-center gap-2">
              <FieldIcon><Shield className="size-3.5" /></FieldIcon>
              {t("form.role")}
            </span>
          }
          htmlFor="access-role"
          required
          error={errors.role ? t(`form.errors.${errors.role}`) : undefined}
        >
          <input type="hidden" name="role" value={role} />
          <RoleSelect id="access-role" value={role} onChange={setRole} />
        </FormField>

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
          {pending ? t("invite.submitting") : t("invite.submit")}
        </Button>
      </div>
    </form>
  );
}

function CorrectEmailPanel({
  person,
  onDone,
}: {
  person: PersonListItem;
  onDone: () => void;
}) {
  const t = useTranslations("pages.settings.people");
  const { errors, formError, pending, run } = useSubmit();

  return (
    <form
      className="flex flex-col flex-1 min-h-0"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        run(() => correctEmailAction(person.id, formData), onDone);
      }}
    >
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        <p className="text-body text-muted">
          {t("correctEmail.description")}
        </p>

        <FormField
          label={
            <span className="flex items-center gap-2">
              <FieldIcon><Mail className="size-3.5" /></FieldIcon>
              {t("form.email")}
            </span>
          }
          htmlFor="correct-email"
          required
          error={errors.email ? t(`form.errors.${errors.email}`) : undefined}
        >
          <Input
            id="correct-email"
            name="email"
            type="email"
            dir="ltr"
            defaultValue={person.linkedEmail ?? ""}
            required
            autoFocus
          />
        </FormField>

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
          {pending ? t("correctEmail.submitting") : t("correctEmail.submit")}
        </Button>
      </div>
    </form>
  );
}

function ChangeRolePanel({
  person,
  onDone,
}: {
  person: PersonListItem;
  onDone: () => void;
}) {
  const t = useTranslations("pages.settings.people");
  const [role, setRole] = useState<string>(person.role ?? "worker");
  const { formError, pending, run } = useSubmit();

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        <FormField
          label={
            <span className="flex items-center gap-2">
              <FieldIcon><Shield className="size-3.5" /></FieldIcon>
              {t("form.role")}
            </span>
          }
          htmlFor="change-role"
        >
          <RoleSelect id="change-role" value={role} onChange={setRole} />
        </FormField>

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
        <Button
          type="button"
          disabled={pending || role === person.role}
          onClick={() =>
            run(() => changeRoleAction(person.id, role as Role), onDone)
          }
        >
          {pending ? t("changeRole.submitting") : t("changeRole.submit")}
        </Button>
      </div>
    </div>
  );
}
