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
import { setStaffMemberActiveAction } from "@/lib/staff/actions";
import type { StaffListItem } from "@/lib/staff/queries";
import { StaffFormDialog, type StageOption } from "./staff-form-dialog";

export function StaffRowActions({
  member,
  stages,
  openTaskCount,
}: {
  member: StaffListItem;
  stages: StageOption[];
  openTaskCount: number;
}) {
  const t = useTranslations("pages.settings.staff");

  return (
    <div className="flex flex-wrap gap-2">
      <StaffFormDialog
        stages={stages}
        member={member}
        trigger={
          <Button size="sm" variant="outline">
            {t("edit")}
          </Button>
        }
      />
      {member.is_active ? (
        <DeactivateDialog member={member} openTaskCount={openTaskCount} />
      ) : (
        <ReactivateButton member={member} />
      )}
    </div>
  );
}

/**
 * Deactivation is the only removal path -- the database withholds the DELETE
 * grant. The dialog spells out the consequence because it is not obvious:
 * the person leaves every assignee picker immediately, but their existing
 * assignments and history stay exactly as they are.
 */
function DeactivateDialog({
  member,
  openTaskCount,
}: {
  member: StaffListItem;
  openTaskCount: number;
}) {
  const t = useTranslations("pages.settings.staff");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    setFormError(undefined);
    startTransition(async () => {
      const result = await setStaffMemberActiveAction(member.id, false);
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
function ReactivateButton({ member }: { member: StaffListItem }) {
  const t = useTranslations("pages.settings.staff");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await setStaffMemberActiveAction(member.id, true);
          if (result.success) router.refresh();
        })
      }
    >
      {t("reactivate.action")}
    </Button>
  );
}
