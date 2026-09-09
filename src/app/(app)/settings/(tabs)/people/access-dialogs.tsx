"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
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
import {
  changeRoleAction,
  correctEmailAction,
  invitePersonAction,
  reinvitePersonAction,
  revokeAccessAction,
} from "@/lib/people/actions";
import type { PersonListItem } from "@/lib/people/queries";
import type { PersonFieldErrors } from "@/lib/people/validation";
import { ROLES, type Role } from "@/lib/roles";

/**
 * The access half of a People row: everything that touches a login rather than
 * the roster. Rendered only for a role with `manageUsers` -- and the actions
 * re-check that themselves, so hiding them here is purely cosmetic.
 */

function useAccessSubmit() {
  const router = useRouter();
  const [errors, setErrors] = useState<PersonFieldErrors>({});
  const [formError, setFormError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  function reset() {
    setErrors({});
    setFormError(undefined);
  }

  function run(
    action: () => Promise<
      | { success: true }
      | { success: false; errors: PersonFieldErrors; formError?: string }
    >,
    onDone: () => void,
  ) {
    reset();
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

  return { errors, formError, pending, reset, run };
}

function RoleSelect({
  value,
  onChange,
  id,
  placeholder,
}: {
  value: string;
  onChange: (next: string) => void;
  id: string;
  placeholder: string;
}) {
  const t = useTranslations("pages.settings.people");
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id}>
        <SelectValue placeholder={placeholder} />
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

/** Grants a login to someone who has none. */
export function InviteDialog({ person }: { person: PersonListItem }) {
  const t = useTranslations("pages.settings.people");
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<string>("worker");
  const { errors, formError, pending, reset, run } = useAccessSubmit();

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          {t("invite.action")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("invite.title")}</DialogTitle>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            run(
              () => invitePersonAction(person.id, formData),
              () => setOpen(false),
            );
          }}
        >
          <p className="text-body text-muted">{t("invite.description")}</p>

          <FormField
            label={t("form.email")}
            htmlFor="invite-email"
            required
            error={errors.email ? t(`form.errors.${errors.email}`) : undefined}
          >
            <Input
              id="invite-email"
              name="email"
              type="email"
              dir="ltr"
              required
            />
          </FormField>

          <FormField
            label={t("form.role")}
            htmlFor="invite-role"
            required
            error={errors.role ? t(`form.errors.${errors.role}`) : undefined}
          >
            <input type="hidden" name="role" value={role} />
            <RoleSelect
              id="invite-role"
              value={role}
              onChange={setRole}
              placeholder={t("form.role")}
            />
          </FormField>

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
              {pending ? t("invite.submitting") : t("invite.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Re-sends the invite email. Not destructive, so no confirmation. */
export function ResendInviteButton({ person }: { person: PersonListItem }) {
  const t = useTranslations("pages.settings.people");
  const { pending, run } = useAccessSubmit();

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() =>
        run(
          () => reinvitePersonAction(person.id),
          () => {},
        )
      }
    >
      {pending ? t("resend.sending") : t("resend.action")}
    </Button>
  );
}

/**
 * Fixes a mistyped invite address. Offered only while the person has never
 * signed in -- after that the account is theirs.
 */
export function CorrectEmailDialog({ person }: { person: PersonListItem }) {
  const t = useTranslations("pages.settings.people");
  const [open, setOpen] = useState(false);
  const { errors, formError, pending, reset, run } = useAccessSubmit();

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          {t("correctEmail.action")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("correctEmail.title")}</DialogTitle>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            run(
              () => correctEmailAction(person.id, formData),
              () => setOpen(false),
            );
          }}
        >
          <p className="text-body text-muted">
            {t("correctEmail.description")}
          </p>

          <FormField
            label={t("form.email")}
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
            />
          </FormField>

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
              {pending
                ? t("correctEmail.submitting")
                : t("correctEmail.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ChangeRoleDialog({ person }: { person: PersonListItem }) {
  const t = useTranslations("pages.settings.people");
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<string>(person.role ?? "worker");
  const { formError, pending, reset, run } = useAccessSubmit();

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          reset();
          setRole(person.role ?? "worker");
        }
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          {t("changeRole.action")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("changeRole.title")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <FormField label={t("form.role")} htmlFor="change-role">
            <RoleSelect
              id="change-role"
              value={role}
              onChange={setRole}
              placeholder={t("form.role")}
            />
          </FormField>

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
            <Button
              type="button"
              disabled={pending || role === person.role}
              onClick={() =>
                run(
                  () => changeRoleAction(person.id, role as Role),
                  () => setOpen(false),
                )
              }
            >
              {pending ? t("changeRole.submitting") : t("changeRole.submit")}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Removes the login but keeps the person on the roster -- they carry on
 * receiving work, they just cannot sign in.
 */
export function RevokeAccessDialog({ person }: { person: PersonListItem }) {
  const t = useTranslations("pages.settings.people");
  const [open, setOpen] = useState(false);
  const { formError, pending, reset, run } = useAccessSubmit();

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="danger-soft">
          {t("revoke.action")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("revoke.title")}</DialogTitle>
        </DialogHeader>

        <p className="text-body text-ink">{t("revoke.confirm")}</p>

        {formError ? (
          <FormMessage variant="error">
            {t(`form.errors.${formError}`)}
          </FormMessage>
        ) : null}

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              {t("revoke.cancel")}
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="danger"
            disabled={pending}
            onClick={() =>
              run(
                () => revokeAccessAction(person.id),
                () => setOpen(false),
              )
            }
          >
            {pending ? t("revoke.submitting") : t("revoke.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
