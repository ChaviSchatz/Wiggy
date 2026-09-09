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
import { FormMessage } from "@/components/ui/form-message";
import { setPersonActiveAction } from "@/lib/people/actions";
import type { PersonAccessState } from "@/lib/people/guards";
import type { PersonListItem } from "@/lib/people/queries";
import {
  ChangeRoleDialog,
  CorrectEmailDialog,
  InviteDialog,
  ResendInviteButton,
  RevokeAccessDialog,
} from "./access-dialogs";
import { PersonFormDialog, type StageOption } from "./person-form-dialog";

/**
 * Roster actions first, then the access actions that apply to this row's
 * state. Unavailable actions are absent rather than disabled: a manager's row
 * simply ends earlier instead of showing a line of dead controls.
 */
export function PersonRowActions({
  person,
  stages,
  openTaskCount,
  accessState,
  canManageAccess,
}: {
  person: PersonListItem;
  stages: StageOption[];
  openTaskCount: number;
  accessState: PersonAccessState;
  canManageAccess: boolean;
}) {
  const t = useTranslations("pages.settings.people");

  return (
    <div className="flex flex-wrap items-center gap-2">
      <PersonFormDialog
        stages={stages}
        person={person}
        canManageAccess={canManageAccess}
        trigger={
          <Button size="sm" variant="outline">
            {t("edit")}
          </Button>
        }
      />

      {person.is_active ? (
        <DeactivateDialog
          person={person}
          openTaskCount={openTaskCount}
          hasLogin={accessState !== "rosterOnly"}
        />
      ) : (
        <ReactivateButton person={person} />
      )}

      {canManageAccess && person.is_active ? (
        <>
          <span className="h-4 w-px bg-line" aria-hidden />
          {accessState === "rosterOnly" ? (
            <InviteDialog person={person} />
          ) : null}
          {accessState === "invited" ? (
            <>
              <ResendInviteButton person={person} />
              <CorrectEmailDialog person={person} />
            </>
          ) : null}
          {accessState !== "rosterOnly" ? (
            <>
              <ChangeRoleDialog person={person} />
              <RevokeAccessDialog person={person} />
            </>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

/**
 * Deactivation is the only removal path -- the database withholds the DELETE
 * grant. The dialog spells out the consequences because they are not
 * self-evident: the person leaves every assignee picker immediately and loses
 * their login, but their existing assignments and history stay exactly as
 * they are.
 */
function DeactivateDialog({
  person,
  openTaskCount,
  hasLogin,
}: {
  person: PersonListItem;
  openTaskCount: number;
  hasLogin: boolean;
}) {
  const t = useTranslations("pages.settings.people");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    setFormError(undefined);
    startTransition(async () => {
      const result = await setPersonActiveAction(person.id, false);
      if (!result.success) {
        setFormError(result.formError ?? "generic");
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setFormError(undefined);
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="danger-soft">
          {t("deactivate.action")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("deactivate.title")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 text-body text-ink">
          <p>{t("deactivate.confirm")}</p>
          <p className="text-muted">
            {t("deactivate.openTasks", { count: openTaskCount })}
          </p>
          <p className="text-muted">{t("deactivate.keepsHistory")}</p>
          {hasLogin ? (
            <p className="text-muted">{t("deactivate.losesLogin")}</p>
          ) : null}
        </div>

        {formError ? (
          <FormMessage variant="error">
            {t(`form.errors.${formError}`)}
          </FormMessage>
        ) : null}

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              {t("deactivate.cancel")}
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="danger"
            onClick={handleConfirm}
            disabled={pending}
          >
            {pending ? t("deactivate.submitting") : t("deactivate.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Reactivating is not destructive, so it needs no confirmation. */
function ReactivateButton({ person }: { person: PersonListItem }) {
  const t = useTranslations("pages.settings.people");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await setPersonActiveAction(person.id, true);
          if (result.success) router.refresh();
        })
      }
    >
      {t("reactivate.action")}
    </Button>
  );
}
