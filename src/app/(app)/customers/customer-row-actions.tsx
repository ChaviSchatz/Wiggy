"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import type { Customer } from "@/lib/customers/queries";
import { CustomerFormDialog } from "./customer-form-dialog";
import { DeleteCustomerDialog } from "./delete-customer-dialog";

export function CustomerRowActions({ customer }: { customer: Customer }) {
  const t = useTranslations("pages.customers");

  return (
    <div
      className="flex justify-end gap-1"
      onClick={(e) => e.stopPropagation()}
    >
      <CustomerFormDialog
        customer={customer}
        trigger={
          <Button variant="ghost" size="icon" aria-label={t("edit")}>
            <Pencil className="size-4" aria-hidden />
          </Button>
        }
      />
      <DeleteCustomerDialog
        customer={customer}
        trigger={
          <Button variant="ghost" size="icon" aria-label={t("delete.title")}>
            <Trash2 className="size-4" aria-hidden />
          </Button>
        }
      />
    </div>
  );
}
