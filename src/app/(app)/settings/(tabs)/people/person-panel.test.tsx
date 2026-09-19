import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PersonListItem } from "@/lib/people/queries";
import messages from "../../../../../../messages/he.json";
import { PersonPanel } from "./person-panel";

const updatePersonAction = vi.fn();
const createPersonAction = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));
vi.mock("@/lib/people/actions", () => ({
  updatePersonAction: (...args: unknown[]) => updatePersonAction(...args),
  createPersonAction: (...args: unknown[]) => createPersonAction(...args),
}));

function person(overrides: Partial<PersonListItem> = {}): PersonListItem {
  return {
    id: "p1",
    business_id: "b1",
    full_name: "דינה",
    title: null,
    default_work_stage_id: null,
    user_id: null,
    is_active: true,
    is_assignable: true,
    is_bookable: false,
    created_at: "2026-09-10T00:00:00Z",
    updated_at: "2026-09-10T00:00:00Z",
    workStageName: null,
    linkedUserName: null,
    linkedEmail: null,
    role: null,
    membershipActive: false,
    ...overrides,
  };
}

function renderPanel(p?: PersonListItem) {
  return render(
    <NextIntlClientProvider locale="he" messages={messages}>
      <PersonPanel
        stages={[]}
        person={p}
        canManageAccess={false}
        onDone={() => {}}
      />
    </NextIntlClientProvider>,
  );
}

const form = messages.pages.settings.people.form;
const bookable = () =>
  screen.getByRole("checkbox", { name: new RegExp(form.isBookable) });

describe("PersonPanel bookable toggle", () => {
  beforeEach(() => {
    updatePersonAction.mockReset().mockResolvedValue({ success: true });
    createPersonAction.mockReset().mockResolvedValue({ success: true });
  });

  it("defaults to unchecked for a new person", () => {
    renderPanel();
    expect(bookable()).not.toBeChecked();
  });

  it("reflects the stored value when editing", () => {
    renderPanel(person({ is_bookable: true }));
    expect(bookable()).toBeChecked();
  });

  it("submits isBookable when checked", async () => {
    renderPanel(person());
    await userEvent.click(bookable());
    await userEvent.click(screen.getByRole("button", { name: form.save }));

    const formData = updatePersonAction.mock.calls[0][1] as FormData;
    expect(formData.get("isBookable")).not.toBeNull();
  });

  it("omits isBookable when unchecked", async () => {
    renderPanel(person({ is_bookable: true }));
    await userEvent.click(bookable());
    await userEvent.click(screen.getByRole("button", { name: form.save }));

    const formData = updatePersonAction.mock.calls[0][1] as FormData;
    expect(formData.get("isBookable")).toBeNull();
  });
});
