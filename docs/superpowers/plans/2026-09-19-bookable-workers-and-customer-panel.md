# Bookable workers toggle + customer side panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let admins/managers mark a person as "bookable" from the People panel, and turn the customer edit dialog into the same inline side panel the People screen uses.

**Architecture:** Extract the People panel frame and field-icon chip into shared UI components, reuse them for a new `CustomerPanel`, and wire `is_bookable` (an existing DB column) through the People form/action/table. No migration.

**Tech Stack:** Next.js 14 app router, React, next-intl (Hebrew only, `messages/he.json`), Supabase, Vitest + Testing Library, Tailwind.

Spec: `docs/superpowers/specs/2026-09-19-bookable-workers-and-customer-panel-design.md`

**Repo notes:** The working tree already holds unrelated staged/unstaged changes (`.env.example`, `package*.json`, `src/lib/feedback/*`). Do not touch or stage them. No git commits are made by this plan; leave that to the user.

Test command: `npx vitest run <path>`. Full check at the end: `npx vitest run && npx tsc --noEmit && npm run lint`.

---

## File Structure

- Create `src/components/ui/detail-panel.tsx` — shared inline side-panel frame (header + close + body slot).
- Create `src/components/ui/detail-panel.test.tsx`
- Create `src/components/ui/field-icon.tsx` — the small icon chip used in form labels (currently a private function in `person-panel.tsx`).
- Modify `src/app/(app)/settings/(tabs)/people/people-page-client.tsx` — use `DetailPanel`, responsive wrapper, Bookable column.
- Modify `src/app/(app)/settings/(tabs)/people/person-panel.tsx` — use shared `FieldIcon`, add Bookable checkbox.
- Create `src/app/(app)/settings/(tabs)/people/person-panel.test.tsx`
- Modify `src/lib/people/validation.ts`, `src/lib/people/actions.ts`, `src/lib/people/validation.test.ts` — `isBookable`.
- Create `src/app/(app)/customers/customer-panel.tsx`, `customer-panel.test.tsx`
- Create `src/app/(app)/customers/customers-page-client.tsx` — list + panel state.
- Create `src/app/(app)/customers/customer-detail-client.tsx` — detail cards + panel state.
- Modify `src/app/(app)/customers/page.tsx`, `[id]/page.tsx`, `customer-row-actions.tsx`, `customer-table-row.tsx`.
- Delete `src/app/(app)/customers/customer-form-dialog.tsx`.
- Modify `messages/he.json`.

---

### Task 1: Shared `DetailPanel` and `FieldIcon`

**Files:**
- Create: `src/components/ui/detail-panel.tsx`, `src/components/ui/detail-panel.test.tsx`, `src/components/ui/field-icon.tsx`

- [ ] **Step 1: Write the failing test**

`src/components/ui/detail-panel.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Run it, expect FAIL**

Run: `npx vitest run src/components/ui/detail-panel.test.tsx`
Expected: FAIL — cannot resolve `./detail-panel`.

- [ ] **Step 3: Implement**

`src/components/ui/detail-panel.tsx`:

```tsx
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Inline detail panel: part of the page flow (no overlay), 420px beside the
 * content on `lg`+, stacked under it on narrower screens. Shared by the People
 * and Customers screens so both edit surfaces look identical.
 */
export function DetailPanel({
  leading,
  title,
  subtitle,
  closeLabel,
  onClose,
  className,
  children,
}: {
  /** Avatar or icon circle shown before the title. */
  leading?: React.ReactNode;
  title: string;
  subtitle?: string;
  closeLabel: string;
  onClose: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <aside
      aria-label={title}
      className={cn(
        "w-full lg:w-[420px] shrink-0 rounded-xl border border-line bg-surface shadow-sm flex flex-col overflow-hidden",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
        <div className="flex items-center gap-3 min-w-0">
          {leading}
          <div className="min-w-0">
            <p className="font-semibold text-ink leading-snug">{title}</p>
            {subtitle ? (
              <p className="text-meta text-muted mt-0.5 truncate">{subtitle}</p>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-1 shrink-0 rounded-control p-1 text-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={closeLabel}
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
      {children}
    </aside>
  );
}
```

`src/components/ui/field-icon.tsx`:

```tsx
/** Small icon chip placed before a form label. */
export function FieldIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-md bg-fill-subtle text-muted">
      {children}
    </span>
  );
}
```

- [ ] **Step 4: Run test, expect PASS**

Run: `npx vitest run src/components/ui/detail-panel.test.tsx`

---

### Task 2: People screen uses the shared shell

**Files:**
- Modify: `src/app/(app)/settings/(tabs)/people/people-page-client.tsx`, `person-panel.tsx`, `messages/he.json`

- [ ] **Step 1: Add the close label message**

In `messages/he.json`, inside `pages.settings.people.form`, after `"saving": "שומר/ת...",` add `"close": "סגירה",`. Do the same inside `pages.customers.form` (after its `"saving"`).

- [ ] **Step 2: Swap `person-panel.tsx` to the shared `FieldIcon`**

Delete the local `FieldIcon` function (lines 34-40) and add `import { FieldIcon } from "@/components/ui/field-icon";` next to the other `@/components/ui` imports.

- [ ] **Step 3: Use `DetailPanel` in `people-page-client.tsx`**

Replace the `{panel ? ( <div className="w-[420px] ...">...header...body...</div> ) : null}` block with:

```tsx
      {panel ? (
        <DetailPanel
          leading={
            panel.kind === "create" ? (
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-mauve-100 text-mauve-600">
                <UserPlus className="size-5" aria-hidden />
              </span>
            ) : (
              <Avatar
                name={panel.person.full_name}
                size="lg"
                className="shrink-0"
              />
            )
          }
          title={panelTitle()}
          subtitle={
            panel.kind !== "create" ? panel.person.full_name : undefined
          }
          closeLabel={t("form.close")}
          onClose={close}
        >
          {panel.kind === "create" || panel.kind === "edit" ? (
            <PersonPanel
              stages={stages}
              person={panel.kind === "edit" ? panel.person : undefined}
              canManageAccess={canManageAccess}
              onDone={close}
            />
          ) : (
            <AccessPanel
              kind={panel.kind}
              person={panel.person}
              onDone={close}
            />
          )}
        </DetailPanel>
      ) : null}
```

Change the outer wrapper `<div className="flex items-start gap-6">` to `<div className="flex flex-col gap-6 lg:flex-row lg:items-start">`. Add `import { DetailPanel } from "@/components/ui/detail-panel";` and drop the now-unused `X` from the lucide import (keep `UserPlus`).

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

---

### Task 3: `isBookable` through validation, action and form

**Files:**
- Modify: `src/lib/people/validation.ts`, `src/lib/people/validation.test.ts`, `src/lib/people/actions.ts`, `person-panel.tsx`, `people-page-client.tsx`, `messages/he.json`
- Create: `src/app/(app)/settings/(tabs)/people/person-panel.test.tsx`

- [ ] **Step 1: Write the failing component test**

`src/app/(app)/settings/(tabs)/people/person-panel.test.tsx`:

```tsx
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

const bookableLabel = messages.pages.settings.people.form.isBookable;

describe("PersonPanel bookable toggle", () => {
  beforeEach(() => {
    updatePersonAction.mockReset().mockResolvedValue({ success: true });
    createPersonAction.mockReset().mockResolvedValue({ success: true });
  });

  it("defaults to unchecked for a new person", () => {
    renderPanel();
    expect(screen.getByLabelText(bookableLabel)).not.toBeChecked();
  });

  it("reflects the stored value when editing", () => {
    renderPanel(person({ is_bookable: true }));
    expect(screen.getByLabelText(bookableLabel)).toBeChecked();
  });

  it("submits isBookable when checked", async () => {
    renderPanel(person());
    await userEvent.click(screen.getByLabelText(bookableLabel));
    await userEvent.click(
      screen.getByRole("button", {
        name: messages.pages.settings.people.form.save,
      }),
    );

    const formData = updatePersonAction.mock.calls[0][1] as FormData;
    expect(formData.get("isBookable")).not.toBeNull();
  });

  it("omits isBookable when unchecked", async () => {
    renderPanel(person({ is_bookable: true }));
    await userEvent.click(screen.getByLabelText(bookableLabel));
    await userEvent.click(
      screen.getByRole("button", {
        name: messages.pages.settings.people.form.save,
      }),
    );

    const formData = updatePersonAction.mock.calls[0][1] as FormData;
    expect(formData.get("isBookable")).toBeNull();
  });
});
```

- [ ] **Step 2: Run it, expect FAIL**

Run: `npx vitest run "src/app/(app)/settings/(tabs)/people/person-panel.test.tsx"`
Expected: FAIL (label `isBookable` message missing / checkbox not found).

- [ ] **Step 3: Messages**

In `messages/he.json`, `pages.settings.people.form`, after `"isAssignableHint"` add:

```json
"isBookable": "יש יומן אישי",
"isBookableHint": "מזכירות ומנהלים/ות יוכלו לקבוע תורים ביומן של האדם הזה.",
```

In `pages.settings.people.columns`, after `"assignable"` add `"bookable": "יומן אישי",`. After the `"assignable": { ... }` object add:

```json
"bookable": {
  "yes": "יש יומן",
  "no": "אין יומן"
},
```

- [ ] **Step 4: Validation type + tests' base object**

`src/lib/people/validation.ts`: in `PersonInput`, after `isAssignable: boolean;` add `isBookable: boolean;`.
`src/lib/people/validation.test.ts`: in `base`, after `isAssignable: true,` add `isBookable: false,`.

- [ ] **Step 5: Action**

`src/lib/people/actions.ts`:
- In `readInput`, after the `isAssignable` line add:
  ```ts
  isBookable: formData.get("isBookable") !== null,
  ```
- In `createPersonAction` insert, after `is_assignable: scoped.isAssignable,` add `is_bookable: scoped.isBookable,`.
- In `updatePersonAction` update, after `is_assignable: input.isAssignable,` add `is_bookable: input.isBookable,`.
- In the two internal `validatePersonInput({...})` calls (around lines 293 and 392), after `isAssignable: true,` add `isBookable: false,`.

- [ ] **Step 6: Form checkbox**

In `person-panel.tsx` add `CalendarDays` to the lucide import, then insert right after the "Assignable" `</label>`:

```tsx
        <label className="flex items-start gap-3 text-body text-ink cursor-pointer rounded-lg border border-line bg-fill-subtle/50 px-3 py-2.5">
          <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-md bg-fill-subtle text-muted mt-0.5">
            <CalendarDays className="size-3.5" />
          </span>
          <span className="flex-1">
            {t("form.isBookable")}
            <span className="block text-meta text-muted mt-0.5">
              {t("form.isBookableHint")}
            </span>
          </span>
          <input
            type="checkbox"
            name="isBookable"
            defaultChecked={person ? person.is_bookable : false}
            className="mt-1 size-4 rounded-xs border-line-strong text-mauve-600 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-mauve-100"
          />
        </label>
```

`getByLabelText(bookableLabel)` resolves through the wrapping `<label>`; the label text also contains the hint, so if the test cannot match exactly, change the test query to `{ exact: false }`.

- [ ] **Step 7: Table column**

In `people-page-client.tsx`, after the `columns.assignable` `TableHead` add `<TableHead>{t("columns.bookable")}</TableHead>`, and after the assignable `TableCell` add:

```tsx
                    <TableCell>
                      <span className="text-meta text-muted">
                        {person.is_bookable
                          ? t("bookable.yes")
                          : t("bookable.no")}
                      </span>
                    </TableCell>
```

- [ ] **Step 8: Run tests, expect PASS**

Run: `npx vitest run src/lib/people "src/app/(app)/settings/(tabs)/people"`
Then: `npx tsc --noEmit`

---

### Task 4: `CustomerPanel`

**Files:**
- Create: `src/app/(app)/customers/customer-panel.tsx`, `customer-panel.test.tsx`

- [ ] **Step 1: Write the failing test**

`src/app/(app)/customers/customer-panel.test.tsx`:

```tsx
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
} as Customer;

function renderPanel(props: { customer?: Customer; onDone?: () => void }) {
  return render(
    <NextIntlClientProvider locale="he" messages={messages}>
      <CustomerPanel onDone={props.onDone ?? (() => {})} customer={props.customer} />
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
    expect(screen.getByLabelText(f.nameLabel, { exact: false })).toHaveValue("רות");
    expect(screen.getByLabelText(f.phoneLabel)).toHaveValue("050-1111111");
    expect(screen.getByLabelText(f.emailLabel)).toHaveValue("ruth@example.com");
    expect(screen.getByLabelText(f.notesLabel)).toHaveValue("אלרגיה");
  });

  it("updates an existing customer then closes and refreshes", async () => {
    const onDone = vi.fn();
    renderPanel({ customer, onDone });
    await userEvent.click(screen.getByRole("button", { name: f.save }));

    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(updateCustomerAction).toHaveBeenCalledWith("c1", expect.any(FormData));
    expect(createCustomerAction).not.toHaveBeenCalled();
    expect(refresh).toHaveBeenCalled();
  });

  it("creates a customer when none is given", async () => {
    renderPanel({});
    await userEvent.type(screen.getByLabelText(f.nameLabel, { exact: false }), "חדש");
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
});
```

Before relying on the `{ success: false, errors: { email: "invalid" } }` shape, confirm the value type in `CustomerFieldErrors` (`src/lib/customers/validation.ts`) and adjust the mock to match.

- [ ] **Step 2: Run it, expect FAIL** (`./customer-panel` missing).

Run: `npx vitest run "src/app/(app)/customers/customer-panel.test.tsx"`

- [ ] **Step 3: Implement**

`src/app/(app)/customers/customer-panel.tsx`:

```tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { FileText, Mail, Phone, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FieldIcon } from "@/components/ui/field-icon";
import { FormField } from "@/components/ui/form-field";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createCustomerAction,
  updateCustomerAction,
} from "@/lib/customers/actions";
import type { Customer } from "@/lib/customers/queries";
import type { CustomerFieldErrors } from "@/lib/customers/validation";

/** Create/edit form body for the customer side panel (mirrors `PersonPanel`). */
export function CustomerPanel({
  customer,
  onDone,
}: {
  customer?: Customer;
  onDone: () => void;
}) {
  const t = useTranslations("pages.customers.form");
  const router = useRouter();
  const [errors, setErrors] = useState<CustomerFieldErrors>({});
  const [formError, setFormError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setErrors({});
    setFormError(undefined);

    startTransition(async () => {
      const result = customer
        ? await updateCustomerAction(customer.id, formData)
        : await createCustomerAction(formData);

      if (!result.success) {
        setErrors(result.errors);
        setFormError(result.formError);
        return;
      }
      onDone();
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {formError ? (
          <FormMessage variant="error">{t(`errors.${formError}`)}</FormMessage>
        ) : null}

        <FormField
          label={
            <span className="flex items-center gap-2">
              <FieldIcon>
                <User className="size-3.5" />
              </FieldIcon>
              {t("nameLabel")}
            </span>
          }
          htmlFor="customer-name"
          required
          error={errors.name ? t("errors.nameRequired") : undefined}
        >
          <Input
            id="customer-name"
            name="name"
            defaultValue={customer?.name}
            required
            autoFocus
          />
        </FormField>

        <FormField
          label={
            <span className="flex items-center gap-2">
              <FieldIcon>
                <Phone className="size-3.5" />
              </FieldIcon>
              {t("phoneLabel")}
            </span>
          }
          htmlFor="customer-phone"
        >
          <Input
            id="customer-phone"
            name="phone"
            dir="ltr"
            defaultValue={customer?.phone ?? ""}
          />
        </FormField>

        <FormField
          label={
            <span className="flex items-center gap-2">
              <FieldIcon>
                <Mail className="size-3.5" />
              </FieldIcon>
              {t("emailLabel")}
            </span>
          }
          htmlFor="customer-email"
          error={errors.email ? t("errors.emailInvalid") : undefined}
        >
          <Input
            id="customer-email"
            name="email"
            type="email"
            dir="ltr"
            defaultValue={customer?.email ?? ""}
          />
        </FormField>

        <FormField
          label={
            <span className="flex items-center gap-2">
              <FieldIcon>
                <FileText className="size-3.5" />
              </FieldIcon>
              {t("notesLabel")}
            </span>
          }
          htmlFor="customer-notes"
        >
          <Textarea
            id="customer-notes"
            name="notes"
            defaultValue={customer?.notes ?? ""}
          />
        </FormField>
      </div>

      <div className="border-t border-line px-5 py-4 flex items-center justify-end gap-3">
        <Button type="button" variant="outline" onClick={onDone}>
          {t("cancel")}
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? t("saving") : t("save")}
        </Button>
      </div>
    </form>
  );
}
```

Note: the previous dialog did not set `dir="ltr"` on phone; it is added here to match how email is treated on the People panel. If that looks wrong for Israeli numbers in RTL, drop it from the phone input.

- [ ] **Step 4: Run test, expect PASS**

Run: `npx vitest run "src/app/(app)/customers/customer-panel.test.tsx"`

---

### Task 5: Customers list uses the panel

**Files:**
- Create: `src/app/(app)/customers/customers-page-client.tsx`
- Modify: `page.tsx`, `customer-row-actions.tsx`, `customer-table-row.tsx`

- [ ] **Step 1: `customer-table-row.tsx`** — add a `highlighted` prop:

```tsx
"use client";

import { useRouter } from "next/navigation";

import { TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

/** Row click opens the detail page; the trailing actions cell stops propagation (screen-designs.md #9). */
export function CustomerTableRow({
  href,
  highlighted,
  children,
}: {
  href: string;
  highlighted?: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <TableRow
      className={cn("cursor-pointer", highlighted && "bg-fill-subtle")}
      onClick={() => router.push(href)}
    >
      {children}
    </TableRow>
  );
}
```

- [ ] **Step 2: `customer-row-actions.tsx`** — replace the `CustomerFormDialog` with a button calling `onEdit`:

```tsx
"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import type { Customer } from "@/lib/customers/queries";
import { DeleteCustomerDialog } from "./delete-customer-dialog";

export function CustomerRowActions({
  customer,
  onEdit,
}: {
  customer: Customer;
  onEdit: () => void;
}) {
  const t = useTranslations("pages.customers");

  return (
    <div
      className="flex justify-end gap-1"
      onClick={(e) => e.stopPropagation()}
    >
      <Button variant="ghost" size="icon" aria-label={t("edit")} onClick={onEdit}>
        <Pencil className="size-4" aria-hidden />
      </Button>
      <DeleteCustomerDialog
        customer={customer}
        trigger={
          <Button variant="ghost" size="icon" aria-label={t("delete.title")}>
            <Trash2 className="size-4" aria-hidden />
          </Button>
        }
      />
    </div>
  );
}
```

- [ ] **Step 3: `customers-page-client.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Plus, UserPlus, Users } from "lucide-react";
import { useTranslations } from "next-intl";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DetailPanel } from "@/components/ui/detail-panel";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar } from "@/components/ui/filter-bar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Customer } from "@/lib/customers/queries";
import { CustomerPanel } from "./customer-panel";
import { CustomerRowActions } from "./customer-row-actions";
import { CustomerSearchBar } from "./customer-search-bar";
import { CustomerTableRow } from "./customer-table-row";
import { CustomersPagination } from "./customers-pagination";

type PanelState = { kind: "create" } | { kind: "edit"; customer: Customer };

export function CustomersPageClient({
  customers,
  total,
  page,
  pageSize,
  search,
}: {
  customers: Customer[];
  total: number;
  page: number;
  pageSize: number;
  search: string;
}) {
  const t = useTranslations("pages.customers");
  const [panel, setPanel] = useState<PanelState | null>(null);
  const close = () => setPanel(null);
  const openCreate = () => setPanel({ kind: "create" });

  const newButton = (
    <Button size="sm" className="ms-auto" onClick={openCreate}>
      <Plus className="size-4" aria-hidden />
      {t("newCustomer")}
    </Button>
  );

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <div className="flex-1 min-w-0">
        <FilterBar
          search={<CustomerSearchBar defaultValue={search} />}
          actions={newButton}
        />

        {customers.length === 0 ? (
          <EmptyState
            icon={Users}
            title={search ? t("emptySearchTitle") : t("emptyTitle")}
            description={
              search ? t("emptySearchDescription") : t("emptyDescription")
            }
            action={
              !search ? (
                <Button size="sm" onClick={openCreate}>
                  <Plus className="size-4" aria-hidden />
                  {t("newCustomer")}
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("form.nameLabel")}</TableHead>
                  <TableHead>{t("form.phoneLabel")}</TableHead>
                  <TableHead>{t("form.emailLabel")}</TableHead>
                  <TableHead className="text-end">{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <CustomerTableRow
                    key={customer.id}
                    href={`/customers/${customer.id}`}
                    highlighted={
                      panel?.kind === "edit" &&
                      panel.customer.id === customer.id
                    }
                  >
                    <TableCell className="text-identity">
                      {customer.name}
                    </TableCell>
                    <TableCell className="text-muted">
                      {customer.phone ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted">
                      {customer.email ?? "—"}
                    </TableCell>
                    <TableCell>
                      <CustomerRowActions
                        customer={customer}
                        onEdit={() => setPanel({ kind: "edit", customer })}
                      />
                    </TableCell>
                  </CustomerTableRow>
                ))}
              </TableBody>
            </Table>
            <CustomersPagination
              page={page}
              pageSize={pageSize}
              total={total}
              search={search}
            />
          </>
        )}
      </div>

      {panel ? (
        <DetailPanel
          leading={
            panel.kind === "create" ? (
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-mauve-100 text-mauve-600">
                <UserPlus className="size-5" aria-hidden />
              </span>
            ) : (
              <Avatar
                name={panel.customer.name}
                size="lg"
                className="shrink-0"
              />
            )
          }
          title={
            panel.kind === "create"
              ? t("form.createTitle")
              : t("form.editTitle")
          }
          subtitle={panel.kind === "edit" ? panel.customer.name : undefined}
          closeLabel={t("form.close")}
          onClose={close}
        >
          <CustomerPanel
            key={panel.kind === "edit" ? panel.customer.id : "create"}
            customer={panel.kind === "edit" ? panel.customer : undefined}
            onDone={close}
          />
        </DetailPanel>
      ) : null}
    </div>
  );
}
```

The `key` on `CustomerPanel` matters: the form uses `defaultValue`, so switching from one customer's edit straight to another's (without closing) must remount it or the fields would keep the old values.

`PersonPanel` has the same latent problem on People (clicking edit on person B while A's panel is open). Add `key={panel.kind === "edit" ? panel.person.id : "create"}` to `<PersonPanel>` in `people-page-client.tsx` in the same pass.

- [ ] **Step 4: Slim down `page.tsx`**

Keep the auth/query code. Replace `CustomersView` and its imports so the file ends with:

```tsx
function CustomersView(props: {
  customers: Customer[];
  total: number;
  page: number;
  pageSize: number;
  search: string;
}) {
  const t = useTranslations("pages.customers");

  return (
    <div>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <CustomersPageClient {...props} />
    </div>
  );
}
```

Imports to keep: `redirect`, `useTranslations`, `PageHeader`, `getCurrentUser`, `listCustomers`, `Customer`, `can`, `createServerSupabaseClient`, plus `CustomersPageClient` from `./customers-page-client`. Remove all others (`Plus`, `Users`, `Button`, `EmptyState`, `FilterBar`, table parts, `CustomerFormDialog`, `CustomerRowActions`, `CustomerSearchBar`, `CustomerTableRow`, `CustomersPagination`).

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit` — expect errors only about `customers/[id]/page.tsx` still importing the dialog (fixed next task).

---

### Task 6: Customer detail page uses the panel; remove the dialog

**Files:**
- Create: `src/app/(app)/customers/customer-detail-client.tsx`
- Modify: `src/app/(app)/customers/[id]/page.tsx`
- Delete: `src/app/(app)/customers/customer-form-dialog.tsx`

- [ ] **Step 1: `customer-detail-client.tsx`**

```tsx
"use client";

import { useState } from "react";
import { PackageSearch, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DetailPanel } from "@/components/ui/detail-panel";
import { EmptyState } from "@/components/ui/empty-state";
import type { Customer } from "@/lib/customers/queries";
import { CustomerPanel } from "./customer-panel";
import { DeleteCustomerDialog } from "./delete-customer-dialog";

export function CustomerDetailClient({ customer }: { customer: Customer }) {
  const t = useTranslations("pages.customers");
  const [editing, setEditing] = useState(false);

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <div className="grid flex-1 min-w-0 gap-4 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t("detail.infoTitle")}</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(true)}
              >
                <Pencil className="size-4" aria-hidden />
                {t("edit")}
              </Button>
              <DeleteCustomerDialog
                customer={customer}
                redirectTo="/customers"
                trigger={
                  <Button variant="outline" size="sm">
                    <Trash2 className="size-4" aria-hidden />
                    {t("delete.title")}
                  </Button>
                }
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <DetailRow label={t("form.phoneLabel")} value={customer.phone} />
            <DetailRow label={t("form.emailLabel")} value={customer.email} />
            <DetailRow label={t("form.notesLabel")} value={customer.notes} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("detail.ordersTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={PackageSearch}
              title={t("detail.noOrdersTitle")}
              description={t("detail.noOrdersDescription")}
            />
          </CardContent>
        </Card>
      </div>

      {editing ? (
        <DetailPanel
          leading={
            <Avatar name={customer.name} size="lg" className="shrink-0" />
          }
          title={t("form.editTitle")}
          subtitle={customer.name}
          closeLabel={t("form.close")}
          onClose={() => setEditing(false)}
        >
          <CustomerPanel
            customer={customer}
            onDone={() => setEditing(false)}
          />
        </DetailPanel>
      ) : null}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
      <span className="w-28 shrink-0 text-muted">{label}</span>
      <span className="text-ink">{value ?? "—"}</span>
    </div>
  );
}
```

- [ ] **Step 2: Slim `[id]/page.tsx`**

Keep the auth/`getCustomerById`/`notFound` logic. Replace `CustomerDetailView` body's card grid with `<CustomerDetailClient customer={customer} />`, keeping the back link and `PageHeader`. Drop the now-unused imports (`Pencil`, `PackageSearch`, `Trash2`, `Button`, `Card*`, `EmptyState`, `CustomerFormDialog`, `DeleteCustomerDialog`) and delete the local `DetailRow`; add `import { CustomerDetailClient } from "../customer-detail-client";`.

- [ ] **Step 3: Delete the old dialog**

Run: `rm "src/app/(app)/customers/customer-form-dialog.tsx"`
Run: `grep -rn "customer-form-dialog\|CustomerFormDialog" src` — expect no output.

- [ ] **Step 4: Full verification**

Run: `npx vitest run && npx tsc --noEmit && npm run lint`
Expected: all green.

- [ ] **Step 5: Manual check in the browser** (dev server via `preview_start`, or `npm run dev`)

- Customers list: click the pencil → panel opens beside the table, row highlighted, fields prefilled; save updates the row and closes; "New customer" and the empty-state button open a blank panel; switching from one customer's pencil straight to another shows the new values.
- Customer detail: Edit opens the panel beside the cards.
- People: edit a person, tick "יש יומן אישי", save, confirm the table column reads "יש יומן" and the person appears in `/calendar`'s staff picker / team-week columns.
- Narrow the window below `lg` (1024px): panels stack under the content on both People and Customers.
