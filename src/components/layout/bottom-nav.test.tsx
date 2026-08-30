import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";

import messages from "../../../messages/he.json";
import { BottomNav } from "./bottom-nav";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

function renderWithIntl(ui: React.ReactNode) {
  return render(
    <NextIntlClientProvider locale="he" messages={messages}>
      {ui}
    </NextIntlClientProvider>,
  );
}

describe("BottomNav", () => {
  it("hides Sprint/Approvals from a worker", () => {
    renderWithIntl(<BottomNav role="worker" />);

    expect(screen.getByText(messages.bottomNav.myWork)).toBeInTheDocument();
    expect(screen.getByText(messages.bottomNav.board)).toBeInTheDocument();
    expect(screen.getByText(messages.bottomNav.feedback)).toBeInTheDocument();
    expect(screen.getByText(messages.bottomNav.profile)).toBeInTheDocument();

    expect(
      screen.queryByText(messages.bottomNav.sprint),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(messages.bottomNav.approvals),
    ).not.toBeInTheDocument();
  });

  it("gives a manager reachable links to Sprint and Approvals below the lg breakpoint", () => {
    renderWithIntl(<BottomNav role="manager" />);

    const sprintLink = screen.getByText(messages.bottomNav.sprint).closest("a");
    expect(sprintLink).toHaveAttribute("href", "/sprint");

    const approvalsLink = screen
      .getByText(messages.bottomNav.approvals)
      .closest("a");
    expect(approvalsLink).toHaveAttribute("href", "/approvals");

    // Feedback is dropped for this role to avoid overcrowding the bar.
    expect(
      screen.queryByText(messages.bottomNav.feedback),
    ).not.toBeInTheDocument();
  });
});
