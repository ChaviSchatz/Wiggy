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
import {
  createCustomerAction,
  updateCustomerAction,
} from "@/lib/customers/actions";
import type { Customer } from "@/lib/customers/queries";
import type { CustomerFieldErrors } from "@/lib/customers/validation";

export function CustomerFormDialog({
  customer,
  trigger,
}: {
  customer?: Customer;
  trigger: React.ReactNode;
}) {
  const t = useTranslations("pages.customers.form");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<CustomerFieldErrors>({});
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
      const result = customer
        ? await updateCustomerAction(customer.id, formData)
        : await createCustomerAction(formData);

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
            {customer ? t("editTitle") : t("createTitle")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          {formError ? (
            <FormMessage variant="error">
              {t(`errors.${formError}`)}
            </FormMessage>
          ) : null}
          <div className="space-y-1.5">
            <Label htmlFor="name">{t("nameLabel")}</Label>
            <Input
              id="name"
              name="name"
              defaultValue={customer?.name}
              required
            />
            {errors.name ? (
              <p className="text-sm text-danger-600">
                {t("errors.nameRequired")}
              </p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">{t("phoneLabel")}</Label>
            <Input
              id="phone"
              name="phone"
              defaultValue={customer?.phone ?? ""}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">{t("emailLabel")}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={customer?.email ?? ""}
            />
            {errors.email ? (
              <p className="text-sm text-danger-600">
                {t("errors.emailInvalid")}
              </p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">{t("notesLabel")}</Label>
            <Textarea
              id="notes"
              name="notes"
              defaultValue={customer?.notes ?? ""}
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
