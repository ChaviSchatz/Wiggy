"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { Stepper } from "@/components/domain/stepper";
import { createCustomerAction } from "@/lib/customers/actions";
import { createWorkOrderAction } from "@/lib/work-orders/actions";
import type { ResolvedIntakeItem } from "@/lib/work-orders/types";
import { StepCustomer } from "./step-customer";
import { StepDetails } from "./step-details";
import { StepIntake } from "./step-intake";
import { StepTemplate } from "./step-template";
import type {
  CustomerOption,
  TemplateOption,
  WizardData,
} from "./wizard-types";

const TOTAL_STEPS = 4;

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function NewOrderWizard({
  initialCustomers,
  templates,
  itemsByTemplateId,
}: {
  initialCustomers: CustomerOption[];
  templates: TemplateOption[];
  itemsByTemplateId: Record<string, ResolvedIntakeItem[]>;
}) {
  const t = useTranslations("pages.orders.wizard");
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>({
    customerChoice: { kind: "none" },
    templateId: templates.length === 1 ? templates[0].id : null,
    responses: {},
    dueAt: "",
    priority: "normal",
    orderReceivedDate: todayIso(),
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | undefined>();

  const steps = [
    t("steps.customer"),
    t("steps.template"),
    t("steps.intake"),
    t("steps.details"),
  ];

  function goNext() {
    setStep((current) => Math.min(current + 1, TOTAL_STEPS));
  }
  function goBack() {
    setStep((current) => Math.max(current - 1, 1));
  }

  async function handleSubmit() {
    if (!data.templateId) {
      setSubmitError("template");
      return;
    }

    setSubmitting(true);
    setSubmitError(undefined);

    let customerId: string | null = null;
    if (data.customerChoice.kind === "existing") {
      customerId = data.customerChoice.customer.id;
    } else if (data.customerChoice.kind === "new") {
      const formData = new FormData();
      formData.set("name", data.customerChoice.name);
      formData.set("phone", data.customerChoice.phone);
      formData.set("email", data.customerChoice.email);
      formData.set("notes", "");
      const customerResult = await createCustomerAction(formData);
      if (!customerResult.success) {
        setSubmitting(false);
        setSubmitError("customer");
        return;
      }
      customerId = customerResult.customer.id;
    }

    const result = await createWorkOrderAction({
      customerId,
      intakeTemplateId: data.templateId,
      responses: Object.values(data.responses),
      dueAt: data.dueAt ? new Date(data.dueAt).toISOString() : null,
      priority: data.priority,
      orderReceivedDate: data.orderReceivedDate,
      notes: data.notes,
    });

    if (!result.success) {
      setSubmitting(false);
      setSubmitError(result.error);
      return;
    }

    router.push(`/orders/${result.workOrderId}`);
  }

  const selectedItems = data.templateId
    ? (itemsByTemplateId[data.templateId] ?? [])
    : [];

  return (
    <div>
      <Stepper steps={steps} currentStep={step} />

      {step === 1 ? (
        <StepCustomer
          initialCustomers={initialCustomers}
          value={data.customerChoice}
          onChange={(customerChoice) =>
            setData((d) => ({ ...d, customerChoice }))
          }
          onNext={goNext}
        />
      ) : null}

      {step === 2 ? (
        <StepTemplate
          templates={templates}
          value={data.templateId}
          onChange={(templateId) => setData((d) => ({ ...d, templateId }))}
          onNext={goNext}
          onBack={goBack}
        />
      ) : null}

      {step === 3 ? (
        <StepIntake
          items={selectedItems}
          responses={data.responses}
          onChange={(responses) => setData((d) => ({ ...d, responses }))}
          onNext={goNext}
          onBack={goBack}
        />
      ) : null}

      {step === 4 ? (
        <StepDetails
          dueAt={data.dueAt}
          priority={data.priority}
          orderReceivedDate={data.orderReceivedDate}
          notes={data.notes}
          onChange={(patch) => setData((d) => ({ ...d, ...patch }))}
          onBack={goBack}
          onSubmit={handleSubmit}
          submitting={submitting}
          error={submitError}
        />
      ) : null}
    </div>
  );
}
