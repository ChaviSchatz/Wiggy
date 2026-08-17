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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AssignableStaffMember } from "@/lib/board/queries";
import { createMissingItemAction } from "@/lib/missing-items/actions";
import type { MissingItemOrderOption } from "@/lib/missing-items/queries";
import {
  MISSING_ITEM_KINDS,
  type MissingItemFieldErrors,
} from "@/lib/missing-items/validation";

const selectClass =
  "h-10 w-full rounded-control border border-line bg-surface px-3 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/** Create missing item manually (screen inventory #31). */
export function CreateMissingItemDialog({
  staff,
  orderOptions,
  trigger,
}: {
  staff: AssignableStaffMember[];
  orderOptions: MissingItemOrderOption[];
  trigger: React.ReactNode;
}) {
  const t = useTranslations("pages.missingItems.form");
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
      const result = await createMissingItemAction(formData);
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
          <DialogTitle>{t("createTitle")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          {formError ? (
            <FormMessage variant="error">{t(`errors.${formError}`)}</FormMessage>
          ) : null}
          {orderOptions.length === 0 ? (
            <FormMessage variant="error">{t("noOrders")}</FormMessage>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="workOrderId">{t("orderLabel")}</Label>
            <select
              id="workOrderId"
              name="workOrderId"
              className={selectClass}
              defaultValue=""
              required
            >
              <option value="" disabled>
                {t("orderPlaceholder")}
              </option>
              {orderOptions.map((order) => (
                <option key={order.id} value={order.id}>
                  {t("orderOption", {
                    number: order.number,
                    customer: order.customerName ?? t("noCustomer"),
                  })}
                </option>
              ))}
            </select>
            {errors.workOrderId ? (
              <p className="text-sm text-danger-600">
                {t("errors.workOrderIdRequired")}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="kind">{t("kindLabel")}</Label>
            <select
              id="kind"
              name="kind"
              className={selectClass}
              defaultValue={MISSING_ITEM_KINDS[0]}
            >
              {MISSING_ITEM_KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {tKind(kind)}
                </option>
              ))}
            </select>
            {errors.kind ? (
              <p className="text-sm text-danger-600">{t("errors.kindInvalid")}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">{t("descriptionLabel")}</Label>
            <Input id="description" name="description" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="responsibleStaffMemberId">
              {t("responsibleLabel")}
            </Label>
            <select
              id="responsibleStaffMemberId"
              name="responsibleStaffMemberId"
              className={selectClass}
              defaultValue=""
            >
              <option value="">{t("responsibleNone")}</option>
              {staff.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.full_name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">{t("notesLabel")}</Label>
            <Textarea id="notes" name="notes" />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                {t("cancel")}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending || orderOptions.length === 0}>
              {pending ? t("saving") : t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
