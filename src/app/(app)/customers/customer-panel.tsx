"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { FileText, Mail, Phone, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FieldIcon } from "@/components/ui/field-icon";
import { FormField } from "@/components/ui/form-field";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createCustomerAction,
  updateCustomerAction,
} from "@/lib/customers/actions";
import type { Customer } from "@/lib/customers/queries";
import type { CustomerFieldErrors } from "@/lib/customers/validation";

/** Create/edit form body for the customer side panel (mirrors `PersonPanel`). */
export function CustomerPanel({
  customer,
  onDone,
}: {
  customer?: Customer;
  onDone: () => void;
}) {
  const t = useTranslations("pages.customers.form");
  const router = useRouter();
  const [errors, setErrors] = useState<CustomerFieldErrors>({});
  const [formError, setFormError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

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
      onDone();
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {formError ? (
          <FormMessage variant="error">{t(`errors.${formError}`)}</FormMessage>
        ) : null}

        <FormField
          label={
            <span className="flex items-center gap-2">
              <FieldIcon>
                <User className="size-3.5" />
              </FieldIcon>
              {t("nameLabel")}
            </span>
          }
          htmlFor="customer-name"
          required
          error={errors.name ? t("errors.nameRequired") : undefined}
        >
          <Input
            id="customer-name"
            name="name"
            defaultValue={customer?.name}
            required
            autoFocus
          />
        </FormField>

        <FormField
          label={
            <span className="flex items-center gap-2">
              <FieldIcon>
                <Phone className="size-3.5" />
              </FieldIcon>
              {t("phoneLabel")}
            </span>
          }
          htmlFor="customer-phone"
        >
          <Input
            id="customer-phone"
            name="phone"
            defaultValue={customer?.phone ?? ""}
          />
        </FormField>

        <FormField
          label={
            <span className="flex items-center gap-2">
              <FieldIcon>
                <Mail className="size-3.5" />
              </FieldIcon>
              {t("emailLabel")}
            </span>
          }
          htmlFor="customer-email"
          error={errors.email ? t("errors.emailInvalid") : undefined}
        >
          <Input
            id="customer-email"
            name="email"
            type="email"
            dir="ltr"
            defaultValue={customer?.email ?? ""}
          />
        </FormField>

        <FormField
          label={
            <span className="flex items-center gap-2">
              <FieldIcon>
                <FileText className="size-3.5" />
              </FieldIcon>
              {t("notesLabel")}
            </span>
          }
          htmlFor="customer-notes"
        >
          <Textarea
            id="customer-notes"
            name="notes"
            defaultValue={customer?.notes ?? ""}
          />
        </FormField>
      </div>

      <div className="border-t border-line px-5 py-4 flex items-center justify-end gap-3">
        <Button type="button" variant="outline" onClick={onDone}>
          {t("cancel")}
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? t("saving") : t("save")}
        </Button>
      </div>
    </form>
  );
}
