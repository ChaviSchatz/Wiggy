import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";

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

describe("SideNav", () => {
  it("renders every nav label from the i18n catalog for an admin", () => {
    renderWithIntl(<SideNav role="admin" />);

    for (const label of Object.values(messages.nav)) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("marks the active route with aria-current", () => {
    renderWithIntl(<SideNav role="admin" />);

    const dashboardLink = screen.getByText(messages.nav.dashboard).closest("a");
    expect(dashboardLink).toHaveAttribute("aria-current", "page");
  });

  it("hides office-only sections from a worker", () => {
    renderWithIntl(<SideNav role="worker" />);

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
    renderWithIntl(<SideNav role="secretary" />);

    expect(screen.getByText(messages.nav.orders)).toBeInTheDocument();
    expect(screen.getByText(messages.nav.customers)).toBeInTheDocument();
    expect(screen.getByText(messages.nav.missingItems)).toBeInTheDocument();

    expect(screen.queryByText(messages.nav.myWork)).not.toBeInTheDocument();
    expect(screen.queryByText(messages.nav.sprint)).not.toBeInTheDocument();
    expect(screen.queryByText(messages.nav.approvals)).not.toBeInTheDocument();
    expect(screen.queryByText(messages.nav.settings)).not.toBeInTheDocument();
  });
});
