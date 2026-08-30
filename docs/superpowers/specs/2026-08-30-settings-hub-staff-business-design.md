# Settings — hub, staff members, business settings (design)

> **Status:** approved design, not yet implemented.
> **Covers:** screen inventory #44 (settings hub), #53 (staff members), #56 (business/tenant settings).
> **Supersedes nothing.** This is the first `[config]` slice; the remaining Settings screens
> (#45–#52, #54, #55, #57) stay deferred and get their own specs.

## Why now

`/settings` currently renders a "coming soon" placeholder. That was correct: the screen inventory
marks #44–#57 as `[config]` ("data seeded in v1, editor UI later"), the v1 plan has no config
slice, and `20260803210100_work_definition_rls.sql` grants only `select` on the catalog tables with
the comment _"there is no editor yet … policies/grants get added alongside that editor slice"_.
The deferral is deliberate and enforced down to the database.

What changes the priority is parity, not novelty. The legacy system Fradi and Tzipi use today
already has `StaffSettings.tsx`, `BrandingSettings.tsx`, `UsersSettings.tsx` and friends, and the
original product spec assigns "operational settings (staff, order types, templates, intake forms)"
to the **manager** role — them. Shipping the rebuild without any of it is a regression for the
people already using the product.

"All tenant settings" is nine independent subsystems, too large for one spec. This slice takes the
three that stand alone: the hub, staff members, and business settings.

## Scope

**In:** settings hub (#44), staff members list + create/edit + deactivate (#53), business settings
for timezone and sprint cadence (#56), and the timezone fix that makes the new control meaningful.

**Out:** work stages (#45), task types and groups (#46–#49), intake templates and the builder
(#50–#52 — `screen-designs.md` states the builder "will get its own spec when it is built"), users
and roles (#54), branding (#55), feedback triage (#57).

**Deliberately excluded from #56:** `default_locale`. Only `he` exists (`src/i18n/config.ts`
exports a single `defaultLocale`), so a locale selector would be a control that does nothing.

## Routes and access

```
/settings                 hub — role-filtered list of sections
/settings/staff           #53
/settings/business        #56
```

The hub lists only sections the current role can open, so it is never a list of dead ends. Each
route carries its own `can()` guard, matching every existing page in `src/app/(app)`.

| Route                | Guard                                      | Roles                                |
| -------------------- | ------------------------------------------ | ------------------------------------ |
| `/settings`          | any settings permission below              | manager, admin                       |
| `/settings/staff`    | `manageStaff` (exists)                     | manager, admin                       |
| `/settings/business` | `planSprint` **or** `editBusinessSettings` | manager (cadence only), admin (both) |

This follows the IA role table (`Settings / Admin | 44–57 | manager ✓ (ops) | admin ✓ (all)`) and
the original spec, which reserves branding and user management for admin while giving managers
operational settings.

`nav-items.ts` already role-gates the Settings entry; no change needed there beyond pointing at a
real page.

## Staff members (#53)

**List.** `DataTable`: name, title, default work stage, linked login, status. Sorted by name,
active first. A "show inactive" toggle held in the URL, like the other list filters. Inactive rows
render muted.

**Create / edit.** `Dialog` with `full_name` (required), `title`, `default_work_stage_id` (select
of active work stages).

**`user_id` is display-only.** Linking a staff member to a login belongs to #54, which needs invite
and auth flows. The column shows the linked account when one exists and `—` otherwise.

**Removal is deactivation only.** No delete action, and the migration withholds the `delete` grant
so the decision is structural rather than a convention a later action could quietly break.

Deleting would cascade `on delete set null` into four columns —
`runtime_tasks.assigned_staff_member_id` (including completed tasks),
`runtime_tasks.approver_staff_member_id`, `missing_items.responsible_staff_member_id`, and
`task_types.default_staff_member_id`. Erasing who did the work contradicts the snapshot principle
(architecture §5.1) and the audit story (ADR 0004).

The deactivate dialog states the consequence, because it is not self-evident: the person disappears
from assignee pickers immediately (`fetchAssignableStaff` already filters `is_active`) **but keeps
their existing assignments**. The dialog shows a live count of their tasks still in `LIVE_STATUSES`
(`src/lib/board/queries.ts` — pending, in_progress, awaiting_approval, returned_for_rework,
deferred) so the manager sees exactly what stays assigned.

**Module** `src/lib/staff/` — `queries.ts`, `actions.ts`, `validation.ts`, mirroring
`src/lib/customers/`: pure validation, thin actions, the permission check in the action as the real
gate (RLS covers tenant isolation only).

## Business settings (#56)

Two controls with different gates on one page. Each section renders per-permission; the page is not
all-or-nothing.

| Control        | Stored in                               | Gate                                                    | Rationale                                                                                    |
| -------------- | --------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Timezone       | `businesses.timezone`                   | `editBusinessSettings` (**new permission**, admin only) | RLS on `businesses` is already admin-only via `is_business_admin()`; the app gate mirrors it |
| Sprint cadence | `business_settings.sprint_cadence_days` | `planSprint` (exists)                                   | Already gated this way                                                                       |

`editBusinessSettings` is a **new permission** added to `PERMISSIONS` and granted to `admin` only in
`ROLE_PERMISSIONS` (`src/lib/roles.ts`). Adding a permission is a one-file change by design
(architecture §2), and `roles.test.ts` is extended to cover it.

Timezone options come from `Intl.supportedValuesOf('timeZone')` — no dependency, correct for any
future tenant. Default `Asia/Jerusalem`.

**Cadence remains on the sprint page as well.** Both call the same `setSprintCadenceAction`: one
action, two call sites, no duplicated logic. Adjusting cadence while planning a sprint is the
natural moment for it, so removing it there would be a regression.

## Timezone correctness

`businesses.timezone` exists but nothing reads it. Adding a control without fixing the reads would
ship a dead control, so the fix is part of this slice. It closes a known defect: a sprint created
between 00:00 and 03:00 Israel time currently starts _yesterday_.

New pure module `src/lib/time/business-time.ts`:

```ts
businessDateString(now: Date, timeZone: string): string  // 'YYYY-MM-DD' in that zone
businessDayStart(now: Date, timeZone: string): Date      // UTC instant of that zone's midnight
addCalendarDays(date: string, days: number): string      // calendar-safe arithmetic
```

Framework-agnostic and unit-testable, in the spirit of `src/lib/availability.ts`.

Two call sites change:

- **`createSprintAction`** (`src/lib/sprints/actions.ts`) — `starts_on` uses
  `businessDateString(...)` instead of `new Date().toISOString().slice(0, 10)`; `ends_on` uses
  `addCalendarDays(starts_on, cadenceDays)`.
- **`countCompletedToday`** (`src/lib/dashboard/queries.ts`) — bounds on
  `businessDayStart(...)` instead of the server's `setHours(0, 0, 0, 0)`.

The timezone reaches both through a new `timezone` field on `CurrentUser`.
`getCurrentUserFromClient` already selects the `businesses` row, so this adds a column to an
existing query rather than a new one.

DST is the risk. Tests cover fixed instants either side of Israel's March and October transitions,
plus a second zone to prove nothing is hardcoded.

## Migration

One migration, for staff only:

```sql
grant insert, update on public.staff_members to authenticated;   -- no delete, ever

create policy "staff_members_insert_members"
  on public.staff_members for insert to authenticated
  with check (public.is_business_member(business_id));

create policy "staff_members_update_members"
  on public.staff_members for update to authenticated
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));
```

`businesses` (admin-only update) and `business_settings` (member insert/update) already have the
grants and policies this slice needs. Types are regenerated with `npm run gen:types`.

## Error handling

Actions return the existing form-action shape used by `customers/` and `missing-items/`:
`{ success: true } | { success: false; errors: FieldErrors; formError?: string }`. Validation is
pure and separate from the action.

Every update checks the **affected row count**, not just `error`. PostgREST reports no error when a
filtered mutation matches nothing; three bugs of exactly that shape were fixed in
`board/actions.ts` and `work-orders/actions.ts` on 2026-08-29.

## Testing

**Unit (Vitest, no Supabase)**

- `staff/validation.ts` — required name, trimming, length bounds.
- `business-time.ts` — written test-first. Israel DST boundaries in March and October, a second
  timezone, and the midnight-rollover case that is the original bug.

**Integration (local Supabase, RLS enforced)**

- Cross-tenant insert and update into `staff_members` are denied.
- Deactivation preserves existing task assignments.
- `businesses` update is rejected for a non-admin member and accepted for an admin.

The existing 129 unit and 57 integration tests stay green.

## Documentation

Updated in the same change, per AGENTS.md:

- `docs/architecture.md` — business timezone is authoritative for sprint dates and "today".
- `docs/ui/screen-inventory.md` — #44, #53, #56 built; the rest of section 8 still `[config]`.
- `AGENTS.md` — repo-state paragraph notes the slice and the new `staff_members` write grants.

No ADR. This implements screens the inventory already specifies and fixes a defect; it makes no new
product decision. The deactivate-only rule is a data-integrity consequence of the existing snapshot
and audit decisions, recorded here and in the migration comment.
