# People management — design

**Date:** 2026-09-10
**Screens:** inventory #53 (Staff members) + #54 (Users & roles), **merged into one People screen**
**Status:** designed, approved

## Problem

Once a salon is onboarded through the platform-admin console, its own admin has **no way to give
anyone else a login**. The console creates exactly one admin at tenant-creation time; every
additional worker, secretary or manager has to be created by hand against the Supabase service-role
API. That does not survive real salons onboarding.

The roster half of the problem is already built: `staff_members` (screen #53) lists the people a
salon assigns tasks to. But a roster row is not a login, and `staff_members.user_id` — the column
that bridges the two — is display-only today, with no UI that can ever set it.

## Decision: one People screen, not two

Settings → Staff becomes **Settings → People**, and screen #54 is absorbed into it rather than
shipped as a second tab.

A salon admin thinks in _people_, not in "roster entries" and "user accounts". Two tabs would let
them create Sarah twice — once as staff, once as a user — with nothing connecting the two and no
signal that they had done it. One screen makes that structurally impossible.

**`staff_members` is the spine.** One row per person in the salon. `memberships` hangs off it via
`staff_members.user_id → profiles.id`. A person may have no login (roster-only), and a login may be
granted or corrected later without touching the roster row or its task history.

This is a product decision and is recorded as **ADR 0013**.

## The three states a person can be in

| State       | `user_id` | Has signed in | Shown as                 |
| ----------- | --------- | ------------- | ------------------------ |
| Roster-only | `null`    | —             | "No login"               |
| Invited     | set       | no            | role + **Invited** badge |
| Active      | set       | yes           | role                     |

**All three are equally assignable, editable, and manageable.** Invite state is a badge, never a
gate.

### Assignment does not depend on the invite

`runtime_tasks.assigned_staff_member_id` references `staff_members(id)`, never a login. So a person
who has not accepted — or has no login at all — is fully assignable today; nothing new is needed to
make that work.

The payoff comes from linking early. `inviteUserByEmail` creates the `auth.users` row the moment the
email is sent, and the `handle_new_user` trigger creates the matching `profiles` row with it. Since
`staff_members.user_id` references `profiles(id)`, the link can be written **at invite time**.
`fetchStaffMemberIdForUser` (`src/lib/sprints/queries.ts`) resolves My Work by `user_id`, so when the
invitee finally clicks the email and signs in, **the tasks already assigned to them are waiting in
their queue** — no reconciliation step, no orphaned assignments.

Consequence for `is_assignable` (below): it must **not** be derived from invite state or role.

## Data model

One migration, no new tables.

### `staff_members.is_assignable boolean not null default true`

Controls whether a person appears in assignee pickers. It is the admin's explicit choice on the
Add/Edit form, independent of role and of invite state. `default true` keeps every existing roster
row behaving exactly as it does today.

Rejected alternatives:

- _Derive from `default_work_stage_id is not null`_ — silently couples two unrelated fields; clearing
  a stage would remove someone from pickers with no visible cause.
- _Derive from role_ — breaks immediately for roster-only people, who have no role at all.

### Backfill

The same migration creates a `staff_members` row for every membership that lacks one (today: the
owner account the platform console created), taking `full_name` from `profiles` and setting
`is_assignable = false` — those people demonstrably do no bench work, or they would already be on
the roster. This is the only place `is_assignable` defaults to off.

### Picker sweep — two call sites

Only two queries list staff as _pickable_; both gain `.eq("is_assignable", true)`:

- `fetchAssignableStaff` — `src/lib/board/queries.ts`
- the staff list in `fetchWorkOrderHubData` — `src/lib/work-orders/hub-queries.ts`

The other three `staff_members` reads resolve names by id (`.in("id", staffIds)`) and must keep
seeing everyone, including non-assignable and deactivated people, or historical task attribution
would render blank. They are deliberately untouched.

## Permissions

The two existing permissions keep their current meaning and now share one screen:

| Capability                                    | Permission    | Roles          |
| --------------------------------------------- | ------------- | -------------- |
| Add/edit/deactivate a person, set assignable  | `manageStaff` | admin, manager |
| Invite, re-invite, change role, revoke access | `manageUsers` | admin          |

A **manager** sees every row, including each person's role and invite state, but read-only: invite,
role and revoke controls are not rendered. Visibility without power — a manager needs to see the
workers they assign tasks to.

The hidden UI is cosmetic. **Every action re-checks its own permission server-side**, exactly as
`requireStaffManager` does today.

## Server layer

New `src/lib/people/`, mirroring the existing `src/lib/staff/` shape (`queries.ts`, `actions.ts`,
`validation.ts`). `src/lib/staff/` is absorbed into it.

- `listPeople(supabase, businessId)` — today's `listStaffMembers` plus the joined `memberships.role`.
  Stays RLS-only and unit-testable; the pending lookup is composed in by the page, not the query.
- **Roster writes** (`createPerson`, `updatePerson`, `setPersonActive`) use the normal RLS client and
  require `manageStaff`.
- **Access writes** (`invitePerson`, `reinvitePerson`, `changeRole`, `revokeAccess`) require
  `manageUsers`. Only invite/re-invite need the admin client: `memberships_insert_admins` /
  `_update_admins` RLS already permits a business admin to write memberships directly, so role
  changes and revocation go through the ordinary client. **The service-role surface stays limited to
  the Supabase Auth calls that genuinely require it.**
- `business_id` always comes from `getCurrentUser()`, **never** from form input.

### Shared invite helper

`findUserIdByEmail` and the find-or-invite logic move out of `src/lib/platform-admin/actions.ts` into
`src/lib/invites/`, and both features call it. The helper covers the auth mechanics only —
**each caller supplies its own scope**. The trust boundaries are deliberately different:
platform-admin is gated by the cross-tenant `PLATFORM_ADMIN_EMAILS` allowlist and takes the business
from its form; People derives the business from the calling admin's own session and can never affect
another tenant.

### Pending badge

The People page reads `last_sign_in_at` via the service-role client for the rows that have a
`user_id`, in parallel. No schema change and always accurate. Only this page pays the cost, and a
salon has tens of people, not thousands.

### Correcting a wrong email

On a **pending** row the admin can edit the email. This invites the corrected address, relinks
`staff_members.user_id` to the new auth user, and deactivates the stale membership. The roster row
and every task assigned to it are untouched, because tasks hang off the roster row, not the login.
Only offered while the person has never signed in — once they have, the account is theirs.

The auth user created for the mistyped address is **left in place**, with its membership
deactivated. Deleting auth users is a service-role destructive operation with no undo, and an
orphaned never-signed-in account with no active membership can reach nothing: RLS grants access
through `memberships`, and `is_business_member` requires an active row. Cleaning those up is a
platform-admin concern, not a salon admin's.

`src/lib/staff/` is imported only by the `settings/staff` route being replaced, so the move to
`src/lib/people/` touches no other caller.

## Safety rails

Every one of these is enforced in the action, not the UI:

1. **Last-admin lockout.** Refuse to demote, revoke or deactivate the only remaining active admin.
2. **No self-escalation.** A manager reaching an access action directly gets `forbidden`.
3. **Deactivation keeps attribution.** No hard delete anywhere — the DB withholds the `delete` grant
   on `staff_members` (`20260830120000_staff_settings_rls.sql`). Existing assignments stay put; the
   confirm dialog shows the open-task count via `countOpenTasksForStaff`.
4. **Re-invite is not a delete.** Correcting an email relinks; it never touches the roster row.

### Deactivation is one switch

"Deactivate" means _this person left the salon_: it sets `staff_members.is_active = false` **and**
`memberships.is_active = false`. They stop appearing in pickers and can no longer sign in. Separate
roster/access switches are deliberately not exposed — one concept the salon owner understands. A
person with no login simply has nothing to revoke.

## Screen

Settings → People. Columns: name, title, default stage, **access** (role, or "No login"; plus an
Invited badge), assignable, status. Reuses the existing table, `EmptyState`, and show-inactive link
pattern from the Staff screen, so it inherits the settings tabs' look without new components.

**Add person** is one form: name, title, default stage, assignable, and an optional "give them a
login" section (email + role). Filling in the email invites them and links `user_id` in the same
action — this is what makes creating a person twice impossible.

Row actions: Edit, Deactivate/Reactivate (`manageStaff`); Invite / Resend / Correct email / Change
role / Revoke (`manageUsers`, and only the ones that apply to that row's state).

All copy goes through `messages/he.json` under `pages.settings.people`; no hardcoded strings, logical
properties only (RTL).

## UI composition

The screen is built from existing design-system parts only — no new components — so it reads as a
sibling of the other settings tabs rather than a bolted-on admin panel.

| Need                  | Part                               | Note                                                                                   |
| --------------------- | ---------------------------------- | -------------------------------------------------------------------------------------- |
| Row identity          | `Avatar` + name                    | Exactly as the Staff table does today                                                  |
| Access / invite state | `Badge`                            | `neutral` for a role, `warning` for **Invited**, `idle` for "No login"                 |
| Form rows             | `FormField`                        | Label + control + error as one unit, so validation copy always lands in the same place |
| Stage / role choice   | `Select`                           | **Not** a native `<select>`                                                            |
| Row actions           | `Button` `outline` / `danger-soft` | Same grammar as `StaffRowActions`                                                      |
| Empty state           | `EmptyState`                       | Same as today                                                                          |

### Two corrections to inherit, not copy

The current Staff screen is the template for this one, but it has two things worth fixing **in the
code being replaced** rather than propagating:

1. **`staff-form-dialog.tsx` uses a native `<select>` with a copy-pasted class string** — precisely
   what `design-system.md` §4 and `src/components/ui/select.tsx` say never to do. The People form
   uses the real `Select`.
2. **It hand-rolls `Label` + `Input` + `FormMessage` per field** instead of using `FormField`. With
   the People form growing to ~6 fields plus a conditional access section, that repetition stops
   being harmless.

Both are inside the file being rewritten. No unrelated refactoring.

### Layout

The access section of the Add/Edit form is a bordered sub-panel that appears only when the admin is
granting a login, so a manager (who cannot grant one) never sees an empty region, and a roster-only
person is a three-field form rather than a form with a dead half.

Row actions are grouped by permission — roster actions first, access actions after a separator — so a
manager's row simply ends earlier instead of showing gaps where disabled controls would be. Nothing
is rendered disabled; unavailable actions are absent.

RTL throughout: logical properties only (`ps/pe`, `ms/me`, `text-start/end`), per the
non-negotiable conventions in `AGENTS.md`.

## Docs to update in the same change

Per `AGENTS.md` ("update docs in the same change", "product decisions → an ADR"):

- **`docs/decisions/0013-people-are-one-list-not-staff-and-users.md`** (new) — the merge decision,
  the roster-as-spine model, and assignment-before-acceptance. Added to `docs/decisions/README.md`.
- **`docs/ui/screen-inventory.md`** — #53 and #54 collapse into one **People** entry, marked built.
- **`docs/ui/information-architecture.md`** — Settings → Staff becomes Settings → People, with the
  manager/admin visibility split recorded.
- **`docs/architecture.md`** — the `staff_members` ↔ `memberships` bridge and `is_assignable`.
- **`docs/domains/`** — the person model's three states and the deactivation invariant.
- **`AGENTS.md`** — repo-state paragraph for this slice, including that the service-role client is
  now used by a _tenant-facing_ page (previously platform-admin only).
- **`docs/glossary.md`** — "person", "roster", "assignable", Hebrew mappings for the new UI terms.

## Testing

Follows the repo's existing split — unit-only, no Supabase:

- `validation.ts` — person input, and email required-when-role-given.
- Last-admin predicate and the per-action permission matrix, as pure functions (the pattern
  `roles.test.ts` and `sections.test.ts` already use).
- The two picker queries exclude `is_assignable = false`, while name resolution still finds them.
- The three-state derivation (roster-only / invited / active) from `user_id` + `last_sign_in_at`.

## Out of scope

- **Branding settings** (#55) and **feedback management** (#57) — unrelated screens.
- A full `invitations` table with sent/accepted/expired/revoked history. The derived badge covers the
  real question ("did she get it?"); auditability can come later without migrating this design.
- Self-service profile editing beyond what `/profile` already does.

## Known prerequisite, not fixed here

Inviting an email that already has a membership in **another** salon is a supported case (they gain a
second membership) — but `getCurrentUserFromClient` (`src/lib/auth/current-user.ts`) selects a
membership with `.limit(1)` and no `order by`, so a multi-membership user lands in an arbitrary
business on every login. This is backend audit finding #2 (2026-08-27), still open. This feature
makes it materially easier to hit than the platform console did. It should be fixed before People
ships to a salon that shares staff with another tenant, but it is a separate change with its own
blast radius and is deliberately not folded in here.
