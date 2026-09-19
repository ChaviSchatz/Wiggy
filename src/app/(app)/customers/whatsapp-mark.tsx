"use client";

import { Check, X } from "lucide-react";
import { useTranslations } from "next-intl";

/** ✓ / ✗ for "this customer has WhatsApp", with the meaning as an accessible name. */
export function WhatsappMark({ value }: { value: boolean }) {
  const t = useTranslations("pages.customers.whatsapp");
  const label = value ? t("yes") : t("no");
  const Icon = value ? Check : X;

  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={value ? "inline-flex text-sage-600" : "inline-flex text-idle-600"}
    >
      <Icon className="size-4" aria-hidden />
    </span>
  );
}
