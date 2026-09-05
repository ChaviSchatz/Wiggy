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
};

export type SprintOption = {
  id: string;
  name: string | null;
  startsOn: string;
  endsOn: string;
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
  /** `null` means "not planned into a sprint yet" -- same default as a task
   * that has never been touched in Sprint Planning. */
  sprintId: string | null;
};
