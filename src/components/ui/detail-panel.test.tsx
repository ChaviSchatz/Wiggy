import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DetailPanel } from "./detail-panel";

describe("DetailPanel", () => {
  it("renders title, subtitle and body, and closes via the close button", async () => {
    const onClose = vi.fn();
    render(
      <DetailPanel
        leading={<span data-testid="lead" />}
        title="עריכת לקוח"
        subtitle="דינה"
        closeLabel="סגירה"
        onClose={onClose}
      >
        <p>body</p>
      </DetailPanel>,
    );

    expect(screen.getByText("עריכת לקוח")).toBeInTheDocument();
    expect(screen.getByText("דינה")).toBeInTheDocument();
    expect(screen.getByText("body")).toBeInTheDocument();
    expect(screen.getByTestId("lead")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "סגירה" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("omits the subtitle when none is given", () => {
    render(
      <DetailPanel title="לקוח חדש" closeLabel="סגירה" onClose={() => {}}>
        <p>body</p>
      </DetailPanel>,
    );
    expect(screen.getByText("לקוח חדש")).toBeInTheDocument();
  });
});
