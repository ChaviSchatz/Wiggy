import type { ItemResponse } from "@/lib/work-orders/types";

export type CustomerOption = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
};

export type TemplateOption = {
  id: string;
  name: string;
  description: string | null;
  workOrderKind: string;
};

export type CustomerChoice =
  | { kind: "none" }
  | { kind: "existing"; customer: CustomerOption }
  | { kind: "new"; name: string; phone: string; email: string };

export type WizardData = {
  customerChoice: CustomerChoice;
  templateId: string | null;
  responses: Record<string, ItemResponse>;
  dueAt: string;
  priority: "normal" | "urgent";
  orderReceivedDate: string;
  notes: string;
};
