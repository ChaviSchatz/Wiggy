"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { MoreHorizontal, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormMessage } from "@/components/ui/form-message";
import { IconButton } from "@/components/ui/icon-button";
import { MenuItem } from "@/components/ui/menu-item";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  reinvitePersonAction,
  revokeAccessAction,
  setPersonActiveAction,
} from "@/lib/people/actions";
import type { PersonAccessState } from "@/lib/people/guards";
import type { PersonListItem } from "@/lib/people/queries";
import type { PanelState } from "./people-page-client";

/**
 * Edit rides in the row as an icon; everything else lives behind `…`. A row
 * that spells out all six actions turns the column into noise, and the rarer
 * an action is, the less it deserves permanent width.
 */
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
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirm, setConfirm] = useState<"deactivate" | "revoke" | null>(null);
  const [pending, startTransition] = useTransition();

  const hasLogin = accessState !== "rosterOnly";
  const manageAccess = canManageAccess && person.is_active;

  function run(action: () => Promise<unknown>) {
    setMenuOpen(false);
    startTransition(async () => {
      await action();
      router.refresh();
    });
  }

  function openPanel(panel: PanelState) {
    setMenuOpen(false);
    onOpenPanel(panel);
  }

  return (
    <div className="flex items-center justify-end gap-0.5">
      <IconButton
        dense
        icon={<Pencil className="size-4" aria-hidden />}
        label={t("edit")}
        onClick={() => onOpenPanel({ kind: "edit", person })}
      />

      <Popover open={menuOpen} onOpenChange={setMenuOpen}>
        <PopoverTrigger asChild>
          <IconButton
            dense
            icon={<MoreHorizontal className="size-[18px]" aria-hidden />}
            label={t("moreActions")}
          />
        </PopoverTrigger>
        <PopoverContent align="end" className="w-52 p-1.5">
          {person.is_active ? (
            <MenuItem
              tone="danger"
              onClick={() => {
                setMenuOpen(false);
                setConfirm("deactivate");
              }}
            >
              {t("deactivate.action")}
            </MenuItem>
          ) : (
            <MenuItem
              disabled={pending}
              onClick={() => run(() => setPersonActiveAction(person.id, true))}
            >
              {t("reactivate.action")}
            </MenuItem>
          )}

          {manageAccess && !hasLogin ? (
            <MenuItem onClick={() => openPanel({ kind: "invite", person })}>
              {t("invite.action")}
            </MenuItem>
          ) : null}

          {manageAccess && accessState === "invited" ? (
            <>
              <MenuItem
                disabled={pending}
                onClick={() => run(() => reinvitePersonAction(person.id))}
              >
                {pending ? t("resend.sending") : t("resend.action")}
              </MenuItem>
              <MenuItem
                onClick={() => openPanel({ kind: "correctEmail", person })}
              >
                {t("correctEmail.action")}
              </MenuItem>
            </>
          ) : null}

          {manageAccess && hasLogin ? (
            <>
              <MenuItem
                onClick={() => openPanel({ kind: "changeRole", person })}
              >
                {t("changeRole.action")}
              </MenuItem>
              <MenuItem
                tone="danger"
                onClick={() => {
                  setMenuOpen(false);
                  setConfirm("revoke");
                }}
              >
                {t("revoke.action")}
              </MenuItem>
            </>
          ) : null}
        </PopoverContent>
      </Popover>

      <DeactivateDialog
        person={person}
        openTaskCount={openTaskCount}
        hasLogin={hasLogin}
        open={confirm === "deactivate"}
        onClose={() => setConfirm(null)}
      />
      <RevokeAccessDialog
        person={person}
        open={confirm === "revoke"}
        onClose={() => setConfirm(null)}
      />
    </div>
  );
}

function DeactivateDialog({
  person,
  openTaskCount,
  hasLogin,
  open,
  onClose,
}: {
  person: PersonListItem;
  openTaskCount: number;
  hasLogin: boolean;
  open: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("pages.settings.people");
  const router = useRouter();
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
      onClose();
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setFormError(undefined);
          onClose();
        }
      }}
    >
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

function RevokeAccessDialog({
  person,
  open,
  onClose,
}: {
  person: PersonListItem;
  open: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("pages.settings.people");
  const router = useRouter();
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
      onClose();
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setFormError(undefined);
          onClose();
        }
      }}
    >
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
