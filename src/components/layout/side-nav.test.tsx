import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";

import type { CurrentUser } from "@/lib/auth/types";
import type { Role } from "@/lib/roles";
import messages from "../../../messages/he.json";
import { SideNav } from "./side-nav";

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

function userWithRole(role: Role): CurrentUser {
  return {
    id: "user-1",
    email: "test@wiggy.local",
    fullName: "שרה כהן",
    avatarUrl: null,
    businessId: "business-1",
    businessName: "מספרת דוגמה",
    timezone: "Asia/Jerusalem",
    role,
  };
}

function renderSideNav(role: Role) {
  return renderWithIntl(<SideNav user={userWithRole(role)} role={role} />);
}

describe("SideNav", () => {
  it("renders every nav label from the i18n catalog for an admin", () => {
    renderSideNav("admin");

    for (const label of Object.values(messages.nav)) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("marks the active route with aria-current", () => {
    renderSideNav("admin");

    const dashboardLink = screen.getByText(messages.nav.dashboard).closest("a");
    expect(dashboardLink).toHaveAttribute("aria-current", "page");
  });

  it("hides office-only sections from a worker", () => {
    renderSideNav("worker");

    expect(screen.getByText(messages.nav.dashboard)).toBeInTheDocument();
    expect(screen.getByText(messages.nav.myWork)).toBeInTheDocument();
    expect(screen.getByText(messages.nav.board)).toBeInTheDocument();

    expect(screen.queryByText(messages.nav.sprint)).not.toBeInTheDocument();
    expect(screen.queryByText(messages.nav.approvals)).not.toBeInTheDocument();
    expect(screen.queryByText(messages.nav.orders)).not.toBeInTheDocument();
    expect(screen.queryByText(messages.nav.customers)).not.toBeInTheDocument();
    expect(
      screen.queryByText(messages.nav.missingItems),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(messages.nav.settings)).not.toBeInTheDocument();
  });

  it("shows the secretary's order/customer sections but not sprint/settings", () => {
    renderSideNav("secretary");

    expect(screen.getByText(messages.nav.orders)).toBeInTheDocument();
    expect(screen.getByText(messages.nav.customers)).toBeInTheDocument();
    expect(screen.getByText(messages.nav.missingItems)).toBeInTheDocument();

    expect(screen.queryByText(messages.nav.myWork)).not.toBeInTheDocument();
    expect(screen.queryByText(messages.nav.sprint)).not.toBeInTheDocument();
    expect(screen.queryByText(messages.nav.approvals)).not.toBeInTheDocument();
    expect(screen.queryByText(messages.nav.settings)).not.toBeInTheDocument();
  });
});
