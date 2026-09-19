"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { AssigneePicker } from "@/components/domain/assignee-picker";
import { Avatar } from "@/components/ui/avatar";
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
import type { AssignableStaffMember } from "@/lib/board/queries";
import { assignMissingItemResponsibleAction } from "@/lib/missing-items/actions";
import type { MissingItemListItem } from "@/lib/missing-items/queries";

/**
 * The list's "responsible" cell: shows who is chasing the item and lets a
 * manager/secretary assign or change them in place, instead of a dead "—" that
 * forces a detour through the Handle dialog. Mirrors the board's tap-avatar
 * reassignment.
 */
export function ResponsibleCell({
  item,
  staff,
}: {
  item: MissingItemListItem;
  staff: AssignableStaffMember[];
}) {
  const t = useTranslations("pages.missingItems.assignDialog");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(
    item.responsible_staff_member_id,
  );
  const [formError, setFormError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      // Start from the saved value each time, not a discarded earlier pick.
      setSelectedId(item.responsible_staff_member_id);
    } else {
      setFormError(undefined);
    }
  }

  function save() {
    setFormError(undefined);
    startTransition(async () => {
      const result = await assignMissingItemResponsibleAction(
        item.id,
        selectedId,
      );
      if (!result.success) {
        setFormError(result.formError ?? "generic");
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="-mx-1.5 inline-flex min-h-8 items-center gap-2 rounded-control px-1.5 text-start transition-colors hover:bg-mauve-100/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Avatar name={item.responsibleName} size="sm" />
          {item.responsibleName ? (
            <span className="text-ink">{item.responsibleName}</span>
          ) : (
            <span className="text-mauve-600">{t("cta")}</span>
          )}
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>

        {formError ? (
          <FormMessage variant="error">{t(`errors.${formError}`)}</FormMessage>
        ) : null}

        <AssigneePicker
          staff={staff.map((member) => ({
            id: member.id,
            name: member.full_name,
          }))}
          value={selectedId}
          onChange={setSelectedId}
          unassignedLabel={t("unassign")}
        />

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              {t("cancel")}
            </Button>
          </DialogClose>
          <Button type="button" onClick={save} disabled={pending}>
            {pending ? t("saving") : t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
