# Bookable workers toggle + customer edit side panel

Date: 2026-09-19

Two independent changes, approved together.

## Part 1 — "Bookable" toggle on the worker (People) panel

**Problem.** `staff_members.is_bookable` already exists and drives who gets a
calendar column and appears in the booking staff picker
(`src/lib/appointments/queries.ts`, `src/lib/auth/current-user.ts`,
`src/components/layout/nav-items.ts`). No UI or action sets it, so today it can
only be changed in the database.

**Decision (confirmed with Chava).** "Bookable" means *has own calendar*: the
secretary/manager books into that person's calendar. A bookable worker with a
login sees their own calendar read-only. Workers do **not** gain write access to
appointments (`canWriteAppointments` stays tied to `manageAppointments`).

**Changes.**
- `person-panel.tsx`: add a checkbox in the same style as "Assignable", with a
  calendar icon, label "Has own calendar (bookable)" and a hint that
  secretaries/managers can book into this person's calendar.
- `src/lib/people/validation.ts`: add `isBookable: boolean` to `PersonInput`.
- `src/lib/people/actions.ts`: read `isBookable` from the form; write
  `is_bookable` on create and update. Other internal callers that build a
  `PersonInput` default it to `false`.
- `src/lib/people/queries.ts`: include `is_bookable` in `PersonListItem`.
- People table: add a "Bookable" column.
- No migration.
- Tests: extend the existing people validation/queries tests.

## Part 2 — Customer edit becomes an inline side panel

**Problem.** `customer-form-dialog.tsx` is a modal `Dialog`; the People screen
uses an inline side panel with an icon-led header and icon-labelled fields,
which Chava prefers.

**Changes.**
- Extract the panel frame from `people-page-client.tsx` (420px card, avatar/icon
  + title header, close button, body slot) into a shared `DetailPanel`
  component. People and Customers both use it. Below the `lg` breakpoint the
  panel stacks under the content instead of sitting beside it (this also
  applies to People, since it uses the shared shell).
- New `CustomerPanel` replaces `CustomerFormDialog`, structured like
  `PersonPanel`: name, phone, email, notes, each with an icon chip in the
  label; Cancel/Save footer. Reuses `createCustomerAction` /
  `updateCustomerAction` and existing validation unchanged.
- Customers list page: a client wrapper holds the panel state. The table is on
  the left and shrinks when a panel opens; the edited row is highlighted.
  The row edit pencil, the "New customer" button and the empty-state button all
  open the panel.
- Customer detail page (`customers/[id]/page.tsx`): the same panel beside the
  detail content, so editing looks the same everywhere.
- `DeleteCustomerDialog` stays a dialog (confirmation).
- Remove `customer-form-dialog.tsx` once nothing references it.
- Row click still navigates to the detail page; row actions keep stopping
  propagation.

## Out of scope
- Letting workers create/edit appointments themselves.
- Any change to customer server actions or validation rules.
