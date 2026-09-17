import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";

import type { CurrentUser } from "@/lib/auth/types";
import type { Role } from "@/lib/roles";
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

function mockUser(role: Role, isBookable = false): CurrentUser {
  return {
    id: "user-1",
    email: "worker@example.com",
    fullName: "Test User",
    avatarUrl: null,
    businessId: "business-1",
    businessName: "Test Salon",
    timezone: "Asia/Jerusalem",
    role,
    staffMemberId: isBookable ? "staff-1" : null,
    isBookable,
  };
}

describe("BottomNav", () => {
  it("hides Sprint/Approvals from a worker", () => {
    renderWithIntl(<BottomNav user={mockUser("worker")} role="worker" />);

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
    renderWithIntl(<BottomNav user={mockUser("manager")} role="manager" />);

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

  it("shows a bookable worker's own Calendar link, hides it when not bookable", () => {
    const { unmount } = renderWithIntl(
      <BottomNav user={mockUser("worker", true)} role="worker" />,
    );
    const calendarLink = screen
      .getByText(messages.bottomNav.calendar)
      .closest("a");
    expect(calendarLink).toHaveAttribute("href", "/calendar");
    unmount();

    renderWithIntl(<BottomNav user={mockUser("worker", false)} role="worker" />);
    expect(
      screen.queryByText(messages.bottomNav.calendar),
    ).not.toBeInTheDocument();
  });
});
