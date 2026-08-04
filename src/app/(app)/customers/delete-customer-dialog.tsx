"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FormMessage } from "@/components/ui/form-message";
import { deleteCustomerAction } from "@/lib/customers/actions";
import type { Customer } from "@/lib/customers/queries";

export function DeleteCustomerDialog({
  customer,
  trigger,
  /** Where to navigate on success instead of just refreshing (e.g. from the
   * detail page, which no longer has anything to show once deleted). */
  redirectTo,
}: {
  customer: Customer;
  trigger: React.ReactNode;
  redirectTo?: string;
}) {
  const t = useTranslations("pages.customers");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    setError(undefined);
    startTransition(async () => {
      const result = await deleteCustomerAction(customer.id);
      if (!result.success) {
        setError(result.error);
        return;
      }

      setOpen(false);
      if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("delete.title")}</DialogTitle>
          <DialogDescription>
            {t("delete.confirm", { name: customer.name })}
          </DialogDescription>
        </DialogHeader>
        {error ? (
          <FormMessage variant="error">{t(`form.errors.${error}`)}</FormMessage>
        ) : null}
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              {t("delete.cancel")}
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="danger"
            onClick={handleDelete}
            disabled={pending}
          >
            {pending ? t("delete.deleting") : t("delete.confirmAction")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
