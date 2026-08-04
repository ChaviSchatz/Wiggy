"use client";

import { useEffect, useState, useTransition } from "react";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { searchCustomersAction } from "@/lib/work-orders/actions";
import type { CustomerChoice, CustomerOption } from "./wizard-types";

const DEBOUNCE_MS = 300;

export function StepCustomer({
  initialCustomers,
  value,
  onChange,
  onNext,
}: {
  initialCustomers: CustomerOption[];
  value: CustomerChoice;
  onChange: (choice: CustomerChoice) => void;
  onNext: () => void;
}) {
  const t = useTranslations("pages.orders.wizard");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CustomerOption[]>(initialCustomers);
  const [showNewForm, setShowNewForm] = useState(value.kind === "new");
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: value.kind === "new" ? value.name : "",
    phone: value.kind === "new" ? value.phone : "",
    email: value.kind === "new" ? value.email : "",
  });
  const [, startTransition] = useTransition();

  useEffect(() => {
    const handle = setTimeout(() => {
      startTransition(async () => {
        const found = await searchCustomersAction(query);
        setResults(found);
      });
    }, DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [query]);

  function updateNewCustomerField(
    field: "name" | "phone" | "email",
    fieldValue: string,
  ) {
    const next = { ...newCustomerForm, [field]: fieldValue };
    setNewCustomerForm(next);
    onChange({ kind: "new", ...next });
  }

  const canProceed =
    value.kind === "none" ||
    value.kind === "existing" ||
    (value.kind === "new" && value.name.trim().length > 0);

  return (
    <div className="space-y-5">
      <label className="flex items-center gap-2 rounded-control border border-line p-3">
        <input
          type="radio"
          name="customer-choice"
          checked={value.kind === "none"}
          onChange={() => onChange({ kind: "none" })}
          className="accent-mauve-600"
        />
        <span className="text-sm">{t("customer.noCustomer")}</span>
      </label>

      <div className="space-y-2">
        <Label htmlFor="customer-search">{t("customer.searchLabel")}</Label>
        <div className="relative">
          <Search
            className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <Input
            id="customer-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("customer.searchPlaceholder")}
            className="ps-9"
          />
        </div>
        <div className="max-h-56 space-y-1 overflow-y-auto rounded-control border border-line p-2">
          {results.length === 0 ? (
            <p className="p-2 text-sm text-muted">{t("customer.noResults")}</p>
          ) : (
            results.map((customer) => (
              <label
                key={customer.id}
                className="flex cursor-pointer items-center gap-2 rounded-control p-2 hover:bg-mauve-100"
              >
                <input
                  type="radio"
                  name="customer-choice"
                  checked={
                    value.kind === "existing" &&
                    value.customer.id === customer.id
                  }
                  onChange={() => onChange({ kind: "existing", customer })}
                  className="accent-mauve-600"
                />
                <span className="text-sm">
                  {customer.name}
                  {customer.phone ? (
                    <span className="text-muted"> · {customer.phone}</span>
                  ) : null}
                </span>
              </label>
            ))
          )}
        </div>
      </div>

      <div className="space-y-3">
        <button
          type="button"
          className="text-sm text-mauve-600 hover:underline"
          onClick={() => {
            const next = !showNewForm;
            setShowNewForm(next);
            if (next) onChange({ kind: "new", ...newCustomerForm });
          }}
        >
          {showNewForm
            ? t("customer.cancelNew")
            : t("customer.newCustomerToggle")}
        </button>
        {showNewForm ? (
          <div className="space-y-3 rounded-control border border-line p-3">
            <div className="space-y-1.5">
              <Label htmlFor="new-customer-name">
                {t("customer.nameLabel")}
              </Label>
              <Input
                id="new-customer-name"
                value={newCustomerForm.name}
                onChange={(event) =>
                  updateNewCustomerField("name", event.target.value)
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-customer-phone">
                {t("customer.phoneLabel")}
              </Label>
              <Input
                id="new-customer-phone"
                value={newCustomerForm.phone}
                onChange={(event) =>
                  updateNewCustomerField("phone", event.target.value)
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-customer-email">
                {t("customer.emailLabel")}
              </Label>
              <Input
                id="new-customer-email"
                type="email"
                value={newCustomerForm.email}
                onChange={(event) =>
                  updateNewCustomerField("email", event.target.value)
                }
              />
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex justify-end">
        <Button onClick={onNext} disabled={!canProceed}>
          {t("next")}
        </Button>
      </div>
    </div>
  );
}
