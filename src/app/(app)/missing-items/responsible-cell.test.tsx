import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AssignableStaffMember } from "@/lib/board/queries";
import type { MissingItemListItem } from "@/lib/missing-items/queries";
import messages from "../../../../messages/he.json";
import { ResponsibleCell } from "./responsible-cell";

const assignAction = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("@/lib/missing-items/actions", () => ({
  assignMissingItemResponsibleAction: (...a: unknown[]) => assignAction(...a),
}));

const m = messages.pages.missingItems;

const staff = [
  { id: "s1", full_name: "דינה כהן" },
  { id: "s2", full_name: "שירה גולן" },
] as AssignableStaffMember[];

function item(overrides: Partial<MissingItemListItem> = {}) {
  return {
    id: "i1",
    responsible_staff_member_id: null,
    responsibleName: null,
    ...overrides,
  } as MissingItemListItem;
}

function renderCell(i: MissingItemListItem) {
  return render(
    <NextIntlClientProvider locale="he" messages={messages}>
      <ResponsibleCell item={i} staff={staff} />
    </NextIntlClientProvider>,
  );
}

describe("ResponsibleCell", () => {
  beforeEach(() => {
    assignAction.mockReset().mockResolvedValue({ success: true });
    refresh.mockReset();
  });

  it("offers an assign action when nobody is responsible", () => {
    renderCell(item());
    expect(
      screen.getByRole("button", { name: m.assignDialog.cta }),
    ).toBeInTheDocument();
  });

  it("shows the responsible person, still clickable to reassign", () => {
    renderCell(
      item({ responsible_staff_member_id: "s1", responsibleName: "דינה כהן" }),
    );
    expect(
      screen.getByRole("button", { name: /דינה כהן/ }),
    ).toBeInTheDocument();
  });

  it("assigns the chosen person, then closes and refreshes", async () => {
    renderCell(item());
    await userEvent.click(
      screen.getByRole("button", { name: m.assignDialog.cta }),
    );
    await userEvent.click(screen.getByRole("radio", { name: /שירה גולן/ }));
    await userEvent.click(
      screen.getByRole("button", { name: m.assignDialog.save }),
    );

    await waitFor(() => expect(assignAction).toHaveBeenCalledWith("i1", "s2"));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("can clear the assignment", async () => {
    renderCell(
      item({ responsible_staff_member_id: "s1", responsibleName: "דינה כהן" }),
    );
    await userEvent.click(screen.getByRole("button", { name: /דינה כהן/ }));
    await userEvent.click(
      screen.getByRole("radio", { name: m.assignDialog.unassign }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: m.assignDialog.save }),
    );

    await waitFor(() => expect(assignAction).toHaveBeenCalledWith("i1", null));
  });

  it("shows an error and stays open when saving fails", async () => {
    assignAction.mockResolvedValue({
      success: false,
      errors: {},
      formError: "generic",
    });
    renderCell(item());
    await userEvent.click(
      screen.getByRole("button", { name: m.assignDialog.cta }),
    );
    await userEvent.click(screen.getByRole("radio", { name: /דינה כהן/ }));
    await userEvent.click(
      screen.getByRole("button", { name: m.assignDialog.save }),
    );

    expect(
      await screen.findByText(m.assignDialog.errors.generic),
    ).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
  });
});
