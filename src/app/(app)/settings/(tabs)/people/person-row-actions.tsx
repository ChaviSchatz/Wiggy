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
import {
  reinvitePersonAction,
  revokeAccessAction,
  setPersonActiveAction,
} from "@/lib/people/actions";
import type { PersonAccessState } from "@/lib/people/guards";
import type { PersonListItem } from "@/lib/people/queries";
import type { PanelState } from "./people-page-client";

export function PersonRowActions({
  person,
  openTaskCount,
  accessState,
  canManageAccess,
  onOpenPanel,
}: {
  person: PersonListItem;
  openTaskCount: number;
  accessState: PersonAccessState;
  canManageAccess: boolean;
  onOpenPanel: (panel: PanelState) => void;
}) {
  const t = useTranslations("pages.settings.people");

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={() => onOpenPanel({ kind: "edit", person })}
      >
        {t("edit")}
      </Button>

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
            <Button
              size="sm"
              variant="outline"
              onClick={() => onOpenPanel({ kind: "invite", person })}
            >
              {t("invite.action")}
            </Button>
          ) : null}
          {accessState === "invited" ? (
            <>
              <ResendInviteButton person={person} />
              <Button
                size="sm"
                variant="outline"
                onClick={() => onOpenPanel({ kind: "correctEmail", person })}
              >
                {t("correctEmail.action")}
              </Button>
            </>
          ) : null}
          {accessState !== "rosterOnly" ? (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onOpenPanel({ kind: "changeRole", person })}
              >
                {t("changeRole.action")}
              </Button>
              <RevokeAccessDialog person={person} />
            </>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

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

function ResendInviteButton({ person }: { person: PersonListItem }) {
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
          await reinvitePersonAction(person.id);
          router.refresh();
        })
      }
    >
      {pending ? t("resend.sending") : t("resend.action")}
    </Button>
  );
}

function RevokeAccessDialog({ person }: { person: PersonListItem }) {
  const t = useTranslations("pages.settings.people");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    setFormError(undefined);
    startTransition(async () => {
      const result = await revokeAccessAction(person.id);
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
            onClick={handleConfirm}
          >
            {pending ? t("revoke.submitting") : t("revoke.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
