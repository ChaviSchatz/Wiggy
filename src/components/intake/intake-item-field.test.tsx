import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";

import type { ResolvedIntakeItem } from "@/lib/work-orders/types";
import messages from "../../../messages/he.json";
import { IntakeItemField } from "./intake-item-field";

/**
 * The template builder renders this very component read-only as its preview,
 * so "the preview matches the real form" is only true as long as `readOnly`
 * changes nothing but interactivity.
 */

function renderWithIntl(ui: React.ReactNode) {
  return render(
    <NextIntlClientProvider locale="he" messages={messages}>
      {ui}
    </NextIntlClientProvider>,
  );
}

function item(overrides: Partial<ResolvedIntakeItem> = {}): ResolvedIntakeItem {
  return {
    id: "item-1",
    sortOrder: 0,
    itemKind: "field",
    fieldKey: null,
    fieldLabel: "אורך הפאה",
    fieldType: "text",
    options: [],
    config: {},
    taskType: null,
    taskGroupTaskTypes: null,
    ...overrides,
  };
}

describe("IntakeItemField in readOnly mode", () => {
  it("renders a select field with its options, so the builder shows real choices", () => {
    renderWithIntl(
      <IntakeItemField
        item={item({ fieldType: "select", options: ["קצר", "בינוני", "ארוך"] })}
        readOnly
      />,
    );

    const select = screen.getByLabelText("אורך הפאה");
    expect(select.tagName).toBe("SELECT");
    expect(screen.getByRole("option", { name: "קצר" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "ארוך" })).toBeInTheDocument();
  });

  it("disables every control so the preview cannot be typed into", () => {
    renderWithIntl(
      <IntakeItemField item={item({ fieldType: "textarea" })} readOnly />,
    );

    expect(screen.getByLabelText("אורך הפאה")).toBeDisabled();
  });

  it("renders a boolean field as a checkbox", () => {
    renderWithIntl(
      <IntakeItemField item={item({ fieldType: "boolean" })} readOnly />,
    );

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeDisabled();
  });

  it("renders a task group as the checklist the customer sees", () => {
    renderWithIntl(
      <IntakeItemField
        item={item({
          itemKind: "task_group",
          config: { selection_mode: "multi" },
          taskGroupTaskTypes: [
            { id: "a", name: "צבע מלא" },
            { id: "b", name: "שורשים" },
          ] as ResolvedIntakeItem["taskGroupTaskTypes"],
        })}
        readOnly
      />,
    );

    expect(screen.getByText("צבע מלא")).toBeInTheDocument();
    expect(screen.getByText("שורשים")).toBeInTheDocument();
    expect(screen.getAllByRole("checkbox")).toHaveLength(2);
  });

  it("renders a section as its title", () => {
    renderWithIntl(
      <IntakeItemField
        item={item({
          itemKind: "section",
          config: { section_title: "פרטי ההזמנה" },
        })}
        readOnly
      />,
    );

    expect(screen.getByText("פרטי ההזמנה")).toBeInTheDocument();
  });
});

describe("IntakeItemField when interactive", () => {
  it("leaves controls enabled for the wizard", () => {
    renderWithIntl(
      <IntakeItemField
        item={item({ fieldType: "text" })}
        onFieldValue={() => {}}
      />,
    );

    expect(screen.getByLabelText("אורך הפאה")).toBeEnabled();
  });
});
