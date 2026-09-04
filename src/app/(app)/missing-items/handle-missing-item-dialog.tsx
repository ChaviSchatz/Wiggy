"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { AssigneeSelect } from "@/components/domain/assignee-select";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AssignableStaffMember } from "@/lib/board/queries";
import { updateMissingItemStatusAction } from "@/lib/missing-items/actions";
import type { MissingItemListItem } from "@/lib/missing-items/queries";
import {
  MISSING_ITEM_STATUSES,
  type MissingItemFieldErrors,
} from "@/lib/missing-items/validation";

const selectClass =
  "h-10 w-full rounded-control border border-line bg-surface px-3 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/**
 * Missing item detail / handle status (screen inventory #30): walks the item
 * along open -> found -> ordered -> handled, and records who is chasing it.
 */
export function HandleMissingItemDialog({
  item,
  staff,
  trigger,
}: {
  item: MissingItemListItem;
  staff: AssignableStaffMember[];
  trigger: React.ReactNode;
}) {
  const t = useTranslations("pages.missingItems.handleDialog");
  const tStatus = useTranslations("pages.missingItems.status");
  const tKind = useTranslations("pages.missingItems.kind");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<MissingItemFieldErrors>({});
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
      const result = await updateMissingItemStatusAction(item.id, formData);
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
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t("title", {
              kind: tKind(item.kind),
              number: item.orderNumber,
            })}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          {formError ? (
            <FormMessage variant="error">
              {t(`errors.${formError}`)}
            </FormMessage>
          ) : null}

          {item.description ? (
            <p className="text-sm text-muted">{item.description}</p>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor={`status-${item.id}`}>{t("statusLabel")}</Label>
            <select
              id={`status-${item.id}`}
              name="status"
              className={selectClass}
              defaultValue={item.status}
            >
              {MISSING_ITEM_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {tStatus(status)}
                </option>
              ))}
            </select>
            {errors.status ? (
              <p className="text-sm text-danger-600">
                {t("errors.statusInvalid")}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`responsible-${item.id}`}>
              {t("responsibleLabel")}
            </Label>
            <AssigneeSelect
              id={`responsible-${item.id}`}
              name="responsibleStaffMemberId"
              ariaLabel={t("responsibleLabel")}
              staff={staff}
              unassignedLabel={t("responsibleNone")}
              defaultValue={item.responsible_staff_member_id}
              className="w-full"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`notes-${item.id}`}>{t("notesLabel")}</Label>
            <Textarea
              id={`notes-${item.id}`}
              name="notes"
              defaultValue={item.notes ?? ""}
            />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                {t("cancel")}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? t("saving") : t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
