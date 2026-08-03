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
  it("renders every nav label from the i18n catalog", () => {
    renderWithIntl(<SideNav />);

    for (const label of Object.values(messages.nav)) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("marks the active route with aria-current", () => {
    renderWithIntl(<SideNav />);

    const dashboardLink = screen.getByText(messages.nav.dashboard).closest("a");
    expect(dashboardLink).toHaveAttribute("aria-current", "page");
  });
});
