import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Customer } from "@/lib/customers/queries";
import messages from "../../../../messages/he.json";
import { CustomerPanel } from "./customer-panel";

const createCustomerAction = vi.fn();
const updateCustomerAction = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("@/lib/customers/actions", () => ({
  createCustomerAction: (...a: unknown[]) => createCustomerAction(...a),
  updateCustomerAction: (...a: unknown[]) => updateCustomerAction(...a),
}));

const f = messages.pages.customers.form;

const customer = {
  id: "c1",
  business_id: "b1",
  name: "רות",
  phone: "050-1111111",
  email: "ruth@example.com",
  notes: "אלרגיה",
  has_whatsapp: false,
} as Customer;

function renderPanel(props: { customer?: Customer; onDone?: () => void }) {
  return render(
    <NextIntlClientProvider locale="he" messages={messages}>
      <CustomerPanel
        customer={props.customer}
        onDone={props.onDone ?? (() => {})}
      />
    </NextIntlClientProvider>,
  );
}

describe("CustomerPanel", () => {
  beforeEach(() => {
    createCustomerAction.mockReset().mockResolvedValue({ success: true });
    updateCustomerAction.mockReset().mockResolvedValue({ success: true });
    refresh.mockReset();
  });

  it("prefills fields when editing", () => {
    renderPanel({ customer });
    expect(screen.getByLabelText(f.nameLabel, { exact: false })).toHaveValue(
      "רות",
    );
    expect(screen.getByLabelText(f.phoneLabel)).toHaveValue("050-1111111");
    expect(screen.getByLabelText(f.emailLabel)).toHaveValue("ruth@example.com");
    expect(screen.getByLabelText(f.notesLabel)).toHaveValue("אלרגיה");
  });

  it("updates an existing customer then closes and refreshes", async () => {
    const onDone = vi.fn();
    renderPanel({ customer, onDone });
    await userEvent.click(screen.getByRole("button", { name: f.save }));

    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(updateCustomerAction).toHaveBeenCalledWith(
      "c1",
      expect.any(FormData),
    );
    expect(createCustomerAction).not.toHaveBeenCalled();
    expect(refresh).toHaveBeenCalled();
  });

  it("creates a customer when none is given", async () => {
    renderPanel({});
    await userEvent.type(
      screen.getByLabelText(f.nameLabel, { exact: false }),
      "חדש",
    );
    await userEvent.click(screen.getByRole("button", { name: f.save }));

    await waitFor(() => expect(createCustomerAction).toHaveBeenCalled());
    expect(updateCustomerAction).not.toHaveBeenCalled();
  });

  it("shows field errors and stays open on failure", async () => {
    updateCustomerAction.mockResolvedValue({
      success: false,
      errors: { email: "invalid" },
    });
    const onDone = vi.fn();
    renderPanel({ customer, onDone });
    await userEvent.click(screen.getByRole("button", { name: f.save }));

    expect(await screen.findByText(f.errors.emailInvalid)).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it("calls onDone from Cancel", async () => {
    const onDone = vi.fn();
    renderPanel({ customer, onDone });
    await userEvent.click(screen.getByRole("button", { name: f.cancel }));
    expect(onDone).toHaveBeenCalled();
  });

  describe("WhatsApp toggle", () => {
    const whatsapp = () =>
      screen.getByRole("checkbox", { name: new RegExp(f.hasWhatsapp) });

    it("defaults to unchecked for a new customer", () => {
      renderPanel({});
      expect(whatsapp()).not.toBeChecked();
    });

    it("reflects the stored value when editing", () => {
      renderPanel({ customer: { ...customer, has_whatsapp: true } });
      expect(whatsapp()).toBeChecked();
    });

    it("submits hasWhatsapp when checked", async () => {
      renderPanel({ customer });
      await userEvent.click(whatsapp());
      await userEvent.click(screen.getByRole("button", { name: f.save }));

      const formData = updateCustomerAction.mock.calls[0][1] as FormData;
      expect(formData.get("hasWhatsapp")).not.toBeNull();
    });

    it("omits hasWhatsapp when unchecked", async () => {
      renderPanel({ customer: { ...customer, has_whatsapp: true } });
      await userEvent.click(whatsapp());
      await userEvent.click(screen.getByRole("button", { name: f.save }));

      const formData = updateCustomerAction.mock.calls[0][1] as FormData;
      expect(formData.get("hasWhatsapp")).toBeNull();
    });
  });
});
