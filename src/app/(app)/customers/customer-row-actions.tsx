"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { IconButton } from "@/components/ui/icon-button";
import type { Customer } from "@/lib/customers/queries";
import { DeleteCustomerDialog } from "./delete-customer-dialog";

export function CustomerRowActions({
  customer,
  onEdit,
}: {
  customer: Customer;
  onEdit: () => void;
}) {
  const t = useTranslations("pages.customers");

  return (
    <div
      className="flex justify-end gap-1"
      onClick={(e) => e.stopPropagation()}
    >
      <IconButton
        dense
        icon={<Pencil className="size-4" aria-hidden />}
        label={t("edit")}
        onClick={onEdit}
      />
      <DeleteCustomerDialog
        customer={customer}
        trigger={
          <IconButton
            dense
            icon={<Trash2 className="size-4" aria-hidden />}
            label={t("delete.title")}
          />
        }
      />
    </div>
  );
}
