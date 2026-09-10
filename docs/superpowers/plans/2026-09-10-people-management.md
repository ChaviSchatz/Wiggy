# People Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a salon admin add, invite, role-manage and deactivate the people in their salon from one Settings → People screen, where an invited person is fully assignable before they ever accept.

**Architecture:** `staff_members` is the spine (one row per person); `memberships` hangs off it via `staff_members.user_id → profiles.id`. A new `is_assignable` column controls the two assignee-picker queries. Roster writes go through the normal RLS client; only the two Supabase Auth invite calls use the service-role client. Design: `docs/superpowers/specs/2026-09-10-people-management-design.md`.

**Tech Stack:** Next.js App Router (Server Components + Server Actions), TypeScript, Supabase (Postgres + Auth + RLS), next-intl (`he`, RTL), Vitest + Testing Library, Tailwind with the project token layer.

---

## File Structure

**Create:**

- `supabase/migrations/20260910120000_people_is_assignable.sql` — column + backfill
- `src/lib/invites/index.ts` — shared find-or-invite auth mechanics (no tenant scope)
- `src/lib/people/validation.ts` — pure input validation
- `src/lib/people/guards.ts` — pure permission + last-admin predicates
- `src/lib/people/queries.ts` — `listPeople`, `countOpenTasksForStaff`, pending derivation
- `src/lib/people/actions.ts` — roster + access Server Actions
- `src/app/(app)/settings/(tabs)/people/page.tsx`
- `src/app/(app)/settings/(tabs)/people/person-form-dialog.tsx`
- `src/app/(app)/settings/(tabs)/people/person-row-actions.tsx`
- `src/app/(app)/settings/(tabs)/people/access-dialogs.tsx`
- `docs/decisions/0013-people-are-one-list-not-staff-and-users.md`
- Tests: `src/lib/people/{validation,guards,queries}.test.ts`, `src/lib/invites/index.test.ts`

**Modify:**

- `src/lib/board/queries.ts` — `fetchAssignableStaff` filters `is_assignable`
- `src/lib/work-orders/hub-queries.ts` — staff list filters `is_assignable`
- `src/lib/platform-admin/actions.ts` — call the shared invite helper
- `src/app/(app)/settings/sections.ts` + `.test.ts` — `staff` → `people`
- `messages/he.json` — `pages.settings.people`
- `docs/` — ADR index, screen inventory, IA, architecture, glossary, AGENTS.md

**Delete:** `src/lib/staff/` and `src/app/(app)/settings/(tabs)/staff/` (absorbed; no other importers).

---

### Task 1: Migration — `is_assignable` + backfill

**Files:**

- Create: `supabase/migrations/20260910120000_people_is_assignable.sql`
- Modify: `src/lib/supabase/database.types.ts` (generated — never hand-edit)

- [ ] **Step 1: Write the migration**

```sql
-- People management: staff_members becomes the spine for every person in a
-- salon, with memberships hanging off it via user_id.

-- Whether this person appears in assignee pickers. Default true so every
-- existing roster row keeps behaving exactly as it does today; the admin sets
-- it explicitly on the People form. Deliberately NOT derived from role or
-- invite state -- an invited person who has not accepted is still assignable
-- (docs/superpowers/specs/2026-09-10-people-management-design.md).
alter table public.staff_members
  add column is_assignable boolean not null default true;

create index staff_members_assignable_idx
  on public.staff_members (business_id, is_assignable)
  where is_assignable;

-- Backfill: every membership without a roster row gets one (today, the admin
-- the platform console created). is_assignable = false -- these people do no
-- bench work, or they would already be on the roster. This is the only place
-- is_assignable starts off.
insert into public.staff_members (business_id, full_name, user_id, is_assignable)
select
  m.business_id,
  coalesce(nullif(trim(p.full_name), ''), p.email, 'Unknown'),
  m.user_id,
  false
from public.memberships m
join public.profiles p on p.id = m.user_id
where not exists (
  select 1
  from public.staff_members s
  where s.business_id = m.business_id
    and s.user_id = m.user_id
);
```

- [ ] **Step 2: Apply it and regenerate types**

Run: `npx supabase db reset && npm run gen:types`
Expected: reset completes, `git diff src/lib/supabase/database.types.ts` shows `is_assignable: boolean` on `staff_members` Row/Insert/Update.

If local Supabase is not running, start it first (`npx supabase start`; on this machine colima must be up — `colima start`).

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations src/lib/supabase/database.types.ts
git commit -m "feat(people): add staff_members.is_assignable with membership backfill"
```

---

### Task 2: Picker sweep — only assignable people are pickable

**Files:**

- Modify: `src/lib/board/queries.ts` (`fetchAssignableStaff`)
- Modify: `src/lib/work-orders/hub-queries.ts` (staff list, ~line 96)

- [ ] **Step 1: Filter `fetchAssignableStaff`**

In `src/lib/board/queries.ts`, add the filter and explain why it is not the same as `is_active`:

```ts
/** Options for the AssigneePicker. */
export async function fetchAssignableStaff(
  supabase: SupabaseClient<Database>,
  businessId: string,
): Promise<AssignableStaffMember[]> {
  const { data, error } = await supabase
    .from("staff_members")
    .select("id, full_name")
    .eq("business_id", businessId)
    .eq("is_active", true)
    // Separate from is_active: an office-only person (owner, secretary) is
    // active but does no bench work, so they must never be offered as an
    // assignee. Name *resolution* elsewhere deliberately ignores this.
    .eq("is_assignable", true)
    .order("full_name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
```

- [ ] **Step 2: Filter the hub's staff list**

In `src/lib/work-orders/hub-queries.ts`, the `staff_members` select inside the parallel block that already has `.eq("is_active", true)` gains `.eq("is_assignable", true)`. Leave the second `staff_members` read (the one using `.in("id", staffIds)`) untouched — it resolves names for already-assigned tasks and must still find non-assignable and deactivated people.

- [ ] **Step 3: Verify no other picker was missed**

Run: `grep -rn 'from("staff_members")' src/`
Expected: 6 hits. Exactly two carry `is_assignable`; the other four are `.in("id", ...)` name resolution, the settings query, and the actions.

- [ ] **Step 4: Run tests and commit**

Run: `npm test`
Expected: 220 passed.

```bash
git add src/lib/board/queries.ts src/lib/work-orders/hub-queries.ts
git commit -m "feat(people): keep non-assignable people out of assignee pickers"
```

---

### Task 3: Extract the shared invite helper

**Files:**

- Create: `src/lib/invites/index.ts`
- Create: `src/lib/invites/index.test.ts`
- Modify: `src/lib/platform-admin/actions.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it, vi } from "vitest";

import { findUserIdByEmail, normalizeEmail } from "./index";

function adminStub(pages: { id: string; email: string }[][]) {
  let call = 0;
  return {
    auth: {
      admin: {
        listUsers: vi.fn(async () => ({
          data: { users: pages[call++] ?? [] },
          error: null,
        })),
      },
    },
  } as never;
}

describe("normalizeEmail", () => {
  it("lowercases and trims so a retyped address matches the existing user", () => {
    expect(normalizeEmail("  Dina@Example.COM ")).toBe("dina@example.com");
  });
});

describe("findUserIdByEmail", () => {
  it("finds a user on the first page", async () => {
    const admin = adminStub([[{ id: "u1", email: "dina@example.com" }]]);
    expect(await findUserIdByEmail(admin, "dina@example.com")).toBe("u1");
  });

  it("returns undefined when the pages run out", async () => {
    const admin = adminStub([[]]);
    expect(
      await findUserIdByEmail(admin, "nobody@example.com"),
    ).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run src/lib/invites/index.test.ts`
Expected: FAIL — cannot resolve `./index`.

- [ ] **Step 3: Write the helper**

`src/lib/invites/index.ts` — move `findUserIdByEmail` and the find-or-invite body out of `platform-admin/actions.ts` verbatim, minus anything tenant-specific. Key points: `PAGE_SIZE = 200`; `findOrInviteUser(admin, { email, fullName }, redirectTo)` returns `{ userId, invited }` (callers need to know whether an email actually went out); it backfills `profiles.full_name`; it throws `InviteError` with codes `"generic" | "inviteFailed"`. **No `business_id` anywhere in this module** — scope is the caller's job, and the two callers have deliberately different trust boundaries.

- [ ] **Step 4: Run the test**

Run: `npx vitest run src/lib/invites/index.test.ts`
Expected: PASS.

- [ ] **Step 5: Rewire platform-admin and check nothing regressed**

Replace the local `findUserIdByEmail`/`findOrInviteAdmin` in `src/lib/platform-admin/actions.ts` with the shared helper, mapping `InviteError` onto the existing `TenantActionError` codes so its redirect behaviour is unchanged.

Run: `npm test`
Expected: all pass, including the existing platform-admin tests.

- [ ] **Step 6: Commit**

```bash
git add src/lib/invites src/lib/platform-admin/actions.ts
git commit -m "refactor(invites): extract shared find-or-invite helper"
```

---

### Task 4: `src/lib/people/validation.ts`

**Files:**

- Create: `src/lib/people/validation.ts`, `src/lib/people/validation.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";

import { hasFieldErrors, validatePersonInput } from "./validation";

const base = {
  fullName: "דינה",
  title: "",
  defaultWorkStageId: "",
  isAssignable: true,
  email: "",
  role: "",
};

describe("validatePersonInput", () => {
  it("accepts a roster-only person with just a name", () => {
    expect(hasFieldErrors(validatePersonInput(base))).toBe(false);
  });

  it("requires a name", () => {
    expect(validatePersonInput({ ...base, fullName: "  " }).fullName).toBe(
      "required",
    );
  });

  it("rejects a name over 120 characters", () => {
    expect(
      validatePersonInput({ ...base, fullName: "a".repeat(121) }).fullName,
    ).toBe("tooLong");
  });

  // Access is all-or-nothing: granting a login needs both halves, because a
  // membership row cannot exist without a role.
  it("requires a role when an email is given", () => {
    expect(
      validatePersonInput({ ...base, email: "dina@example.com" }).role,
    ).toBe("required");
  });

  it("requires an email when a role is given", () => {
    expect(validatePersonInput({ ...base, role: "worker" }).email).toBe(
      "required",
    );
  });

  it("rejects a malformed email", () => {
    expect(
      validatePersonInput({ ...base, email: "dina@", role: "worker" }).email,
    ).toBe("invalid");
  });

  it("rejects a role that is not a known role", () => {
    expect(
      validatePersonInput({ ...base, email: "d@e.com", role: "owner" }).role,
    ).toBe("invalid");
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run src/lib/people/validation.test.ts`
Expected: FAIL — cannot resolve `./validation`.

- [ ] **Step 3: Implement**

```ts
import { isRole } from "@/lib/roles";

const MAX_NAME_LENGTH = 120;

export type PersonInput = {
  fullName: string;
  title: string;
  defaultWorkStageId: string;
  isAssignable: boolean;
  /** Empty means roster-only: no login is being granted. */
  email: string;
  role: string;
};

export type PersonFieldErrors = Partial<
  Record<"fullName" | "email" | "role", "required" | "tooLong" | "invalid">
>;

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePersonInput(input: PersonInput): PersonFieldErrors {
  const errors: PersonFieldErrors = {};

  const name = input.fullName.trim();
  if (!name) errors.fullName = "required";
  else if (name.length > MAX_NAME_LENGTH) errors.fullName = "tooLong";

  const email = input.email.trim();
  const role = input.role.trim();

  if (email && !isValidEmail(email)) errors.email = "invalid";
  if (role && !isRole(role)) errors.role = "invalid";

  // A membership needs both halves or neither.
  if (email && !role) errors.role = errors.role ?? "required";
  if (role && !email) errors.email = errors.email ?? "required";

  return errors;
}

export function hasFieldErrors(errors: PersonFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
```

- [ ] **Step 4: Run and commit**

Run: `npx vitest run src/lib/people/validation.test.ts` → PASS

```bash
git add src/lib/people/validation.ts src/lib/people/validation.test.ts
git commit -m "feat(people): add person input validation"
```

---

### Task 5: `src/lib/people/guards.ts` — the safety rails as pure functions

**Files:**

- Create: `src/lib/people/guards.ts`, `src/lib/people/guards.test.ts`

These are pure so the rails are testable without a database — the point of the design's "enforced in the action, not the UI".

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";

import { derivePersonAccessState, wouldRemoveLastAdmin } from "./guards";

describe("wouldRemoveLastAdmin", () => {
  const admins = [{ userId: "a1" }, { userId: "a2" }];

  it("blocks demoting the only active admin", () => {
    expect(wouldRemoveLastAdmin([{ userId: "a1" }], "a1")).toBe(true);
  });

  it("allows demoting an admin when another remains", () => {
    expect(wouldRemoveLastAdmin(admins, "a1")).toBe(false);
  });

  it("allows changing a non-admin regardless", () => {
    expect(wouldRemoveLastAdmin([{ userId: "a1" }], "w9")).toBe(false);
  });

  it("blocks when the salon somehow has no admins and we target nobody", () => {
    expect(wouldRemoveLastAdmin([], "a1")).toBe(false);
  });
});

describe("derivePersonAccessState", () => {
  it("is roster-only without a linked user", () => {
    expect(derivePersonAccessState(null, null)).toBe("rosterOnly");
  });

  it("is invited once linked but never signed in", () => {
    expect(derivePersonAccessState("u1", null)).toBe("invited");
  });

  it("is active once they have signed in", () => {
    expect(derivePersonAccessState("u1", "2026-09-10T00:00:00Z")).toBe(
      "active",
    );
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run src/lib/people/guards.test.ts`
Expected: FAIL — cannot resolve `./guards`.

- [ ] **Step 3: Implement**

```ts
export type PersonAccessState = "rosterOnly" | "invited" | "active";

/**
 * Three states, derived — never stored. `lastSignInAt` comes from Supabase
 * Auth via the service-role client; a linked user who has never signed in is
 * still fully assignable, so this only ever drives a badge.
 */
export function derivePersonAccessState(
  userId: string | null,
  lastSignInAt: string | null,
): PersonAccessState {
  if (!userId) return "rosterOnly";
  return lastSignInAt ? "active" : "invited";
}

/**
 * True when demoting/revoking/deactivating `targetUserId` would leave the
 * business with no active admin — the one way this screen could lock a salon
 * out of its own tenant.
 */
export function wouldRemoveLastAdmin(
  activeAdmins: { userId: string }[],
  targetUserId: string,
): boolean {
  return activeAdmins.length === 1 && activeAdmins[0]?.userId === targetUserId;
}
```

- [ ] **Step 4: Run and commit**

Run: `npx vitest run src/lib/people/guards.test.ts` → PASS

```bash
git add src/lib/people/guards.ts src/lib/people/guards.test.ts
git commit -m "feat(people): add last-admin and access-state guards"
```

---

### Task 6: `src/lib/people/queries.ts`

**Files:**

- Create: `src/lib/people/queries.ts`, `src/lib/people/queries.test.ts`

- [ ] **Step 1: Implement the query module**

`listPeople(supabase, businessId)` starts from today's `listStaffMembers` (copy it from `src/lib/staff/queries.ts`) and additionally batch-loads `memberships` for the linked `user_id`s, returning:

```ts
export type PersonListItem = StaffMember & {
  workStageName: string | null;
  linkedUserName: string | null;
  linkedEmail: string | null;
  role: Role | null;
  membershipActive: boolean;
};
```

Keep the batched-then-mapped shape rather than PostgREST embedding, matching `src/lib/board/queries.ts`. Also move `countOpenTasksForStaff` here unchanged.

Add `fetchLastSignInAt(admin, userIds)` in the same module, returning `Map<string, string | null>` from parallel `admin.auth.admin.getUserById` calls. It must **never throw**: a failed lookup degrades to `null` (the person reads as "invited"), because a badge must not be able to take down the page.

- [ ] **Step 2: Test the pure mapping**

Write `queries.test.ts` covering the row-mapping helper — a person with a membership maps to their role; a person without maps to `role: null`; a stage id with no matching stage maps to `null` rather than throwing.

- [ ] **Step 3: Run and commit**

Run: `npx vitest run src/lib/people/queries.test.ts` → PASS

```bash
git add src/lib/people/queries.ts src/lib/people/queries.test.ts
git commit -m "feat(people): add people list query with membership join"
```

---

### Task 7: Roster Server Actions

**Files:**

- Create: `src/lib/people/actions.ts`

- [ ] **Step 1: Implement roster actions**

Port `createStaffMemberAction` / `updateStaffMemberAction` / `setStaffMemberActiveAction` from `src/lib/staff/actions.ts` as `createPersonAction` / `updatePersonAction` / `setPersonActiveAction`, keeping the `PersonActionResult` discriminated-union shape and the `requirePeopleManager` (`manageStaff`) guard. Changes from the originals:

- Persist `is_assignable` from the form.
- `setPersonActiveAction` also flips `memberships.is_active` for a linked user — deactivation is one switch (roster **and** login). Guard it with `wouldRemoveLastAdmin` first, returning `formError: "lastAdmin"`.
- `revalidatePath("/settings/people")` plus `/board` and `/sprint` on deactivation, since both render assignee pickers.

- [ ] **Step 2: Verify types and commit**

Run: `npx tsc --noEmit`
Expected: no errors.

```bash
git add src/lib/people/actions.ts
git commit -m "feat(people): add roster server actions"
```

---

### Task 8: Access Server Actions

**Files:**

- Modify: `src/lib/people/actions.ts`

- [ ] **Step 1: Implement access actions**

All four require `manageUsers` via a separate `requireAccessManager` guard — **not** the roster guard:

- `invitePersonAction(personId, formData)` — validates email+role, resolves the person and asserts `business_id === user.businessId`, calls `findOrInviteUser` with `redirectTo` `${origin}/reset-password`, upserts the membership (`onConflict: "user_id,business_id"`, `is_active: true`), then sets `staff_members.user_id` **in the same action** so assignment-before-acceptance works.
- `reinvitePersonAction(personId)` — resend to the same address.
- `correctEmailAction(personId, formData)` — only when the person's state is `invited`; invites the new address, relinks `user_id`, deactivates the stale membership. Never touches the roster row.
- `changeRoleAction(personId, role)` / `revokeAccessAction(personId)` — plain RLS client (`memberships_update_admins` already permits it), both behind `wouldRemoveLastAdmin`.

Every one re-derives `businessId` from `getCurrentUser()` and filters every write by it.

- [ ] **Step 2: Verify types and commit**

Run: `npx tsc --noEmit` → clean

```bash
git add src/lib/people/actions.ts
git commit -m "feat(people): add invite, role and access server actions"
```

---

### Task 9: Messages

**Files:**

- Modify: `messages/he.json`

- [ ] **Step 1: Add `pages.settings.people`**

Copy `pages.settings.staff` as the base (same `columns`/`status`/`form`/`deactivate`/`reactivate` shape), rename the section title to People, and add: `columns.access`, `columns.assignable`, `access.rosterOnly` / `access.invited` / `access.noLogin`, `roles.{admin,manager,secretary,worker}`, `form.isAssignable`, `form.accessSection`, `form.email`, `form.role`, `invite.*`, `resend.*`, `correctEmail.*`, `changeRole.*`, `revoke.*`, and `form.errors.{invalid,lastAdmin,emailTaken}`. Remove `pages.settings.staff`.

- [ ] **Step 2: Verify the catalog**

Run: `npx vitest run src/i18n/messages.test.ts`
Expected: PASS — this test guards against duplicate keys, which `JSON.parse` cannot reveal.

- [ ] **Step 3: Commit**

```bash
git add messages/he.json
git commit -m "feat(people): add Hebrew copy for the People screen"
```

---

### Task 10: The People screen

**Files:**

- Create: `src/app/(app)/settings/(tabs)/people/page.tsx`, `person-form-dialog.tsx`, `person-row-actions.tsx`, `access-dialogs.tsx`

- [ ] **Step 1: Build the page**

Server Component modelled on the current staff page: `getCurrentUser()`, redirect unless `can(user.role, "manageStaff")`, `listPeople`, `fetchActiveWorkStages`, the open-task counts, and the show-inactive link. Additionally: compute `canManageAccess = can(user.role, "manageUsers")`, and when true, resolve `fetchLastSignInAt` via `createAdminClient()` and derive each row's state with `derivePersonAccessState`.

Columns: name (Avatar + name), title, stage, **access**, **assignable**, status, actions.

- [ ] **Step 2: Build the form dialog**

Uses `FormField` + `Input` + the real `Select` (**not** a native `<select>` — `design-system.md` §4). The access sub-panel (email + role) renders only when `canManageAccess`, inside a `rounded-xs border border-line p-3` block with its own heading. `isAssignable` is a checkbox defaulting to checked.

- [ ] **Step 3: Build the row actions**

Roster actions (Edit, Deactivate/Reactivate) exactly as today. When `canManageAccess`, append the access actions that apply to that row's state — `rosterOnly` → Invite; `invited` → Resend, Correct email, Change role, Revoke; `active` → Change role, Revoke. Unavailable actions are **absent**, never rendered disabled.

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: all clean.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(app)/settings/(tabs)/people"
git commit -m "feat(people): add the Settings People screen"
```

---

### Task 11: Switch the route over and delete the old one

**Files:**

- Modify: `src/app/(app)/settings/sections.ts`, `sections.test.ts`, `(tabs)/settings-tabs.tsx`
- Delete: `src/lib/staff/`, `src/app/(app)/settings/(tabs)/staff/`

- [ ] **Step 1: Repoint the section**

In `sections.ts`, the `staff` entry becomes `{ key: "people", href: "/settings/people", icon: Users, permissions: ["manageStaff"] }`. Update `sections.test.ts` and `settings-tabs.tsx` for the renamed key.

- [ ] **Step 2: Delete the absorbed modules**

```bash
git rm -r src/lib/staff "src/app/(app)/settings/(tabs)/staff"
```

- [ ] **Step 3: Verify nothing still points at them**

Run: `grep -rn 'lib/staff\|settings/staff' src/`
Expected: no matches.

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: all clean.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(people): replace the Staff settings tab with People"
```

---

### Task 12: Docs and ADR

**Files:**

- Create: `docs/decisions/0013-people-are-one-list-not-staff-and-users.md`
- Modify: `docs/decisions/README.md`, `docs/ui/screen-inventory.md`, `docs/ui/information-architecture.md`, `docs/architecture.md`, `docs/glossary.md`, `AGENTS.md`

- [ ] **Step 1: Write ADR 0013**

Follow the existing ADR format (read `0012-urgency-is-two-levels-plus-blocked.md` for the house shape). Context: roster and login were separate concepts with no UI bridge. Decision: one People list, `staff_members` as the spine, invite state as a badge never a gate, assignment independent of acceptance. Consequences: `is_assignable` must be explicit; a tenant-facing page now uses the service-role client; the multi-membership bug becomes easier to hit.

- [ ] **Step 2: Update the other docs**

- `docs/decisions/README.md` — add 0013 to the index.
- `docs/ui/screen-inventory.md` — collapse #53 and #54 into one **People** entry marked **built**.
- `docs/ui/information-architecture.md` — Settings → People, admin/manager split.
- `docs/architecture.md` — the `staff_members` ↔ `memberships` bridge and `is_assignable`.
- `docs/glossary.md` — person / roster / assignable with Hebrew mappings.
- `AGENTS.md` — a repo-state paragraph for this slice, noting the service-role client is now used by a tenant-facing page.

- [ ] **Step 3: Commit**

```bash
git add docs AGENTS.md
git commit -m "docs(people): record ADR 0013 and update screen inventory"
```

---

## Verification before calling this done

Run all of these and paste real output — no claim of success without it (superpowers:verification-before-completion):

```bash
npx tsc --noEmit
npm run lint
npm test
npm run format:check
```

Manual checks that unit tests cannot cover, against local Supabase with `npm run seed:dev`:

1. Admin adds a roster-only person → appears, assignable, no login shown.
2. Admin invites them → **Invited** badge; they are still assignable, and can be assigned a task on the board.
3. Sign in as that invitee → the task assigned before acceptance is waiting in My Work. **This is the feature's whole point.**
4. Manager opens People → sees roles and badges, but no invite/role/revoke controls anywhere.
5. Admin tries to demote themselves as the only admin → blocked with the `lastAdmin` message.
