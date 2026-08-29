# Settings — Hub, Staff, Business Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first `[config]` slice — a Settings hub, a staff-members editor, and business settings (timezone + sprint cadence) — and make `businesses.timezone` actually govern sprint dates and "today".

**Architecture:** Three nested routes under `/settings`, each with its own `can()` guard, following the one-guard-per-route pattern every existing page uses. Two new framework-agnostic domain modules (`src/lib/staff/`, `src/lib/time/`) with pure logic separated from thin Server-Action adapters, per architecture §1.3. One migration adds `insert`/`update` (never `delete`) on `staff_members`.

**Tech Stack:** Next.js App Router (RSC + Server Actions), TypeScript, Supabase (Postgres + RLS), Tailwind + shadcn/ui, next-intl (locale `he`, `dir="rtl"`), Vitest.

**Spec:** `docs/superpowers/specs/2026-08-30-settings-hub-staff-business-design.md`

---

## File Structure

**Create:**

| File                                                         | Responsibility                                    |
| ------------------------------------------------------------ | ------------------------------------------------- |
| `src/lib/time/business-time.ts`                              | Pure timezone/date helpers. No Next, no Supabase. |
| `src/lib/time/business-time.test.ts`                         | Unit tests incl. DST boundaries.                  |
| `src/lib/staff/validation.ts`                                | Pure validation of staff input.                   |
| `src/lib/staff/validation.test.ts`                           | Unit tests.                                       |
| `src/lib/staff/queries.ts`                                   | Staff reads (list, open-task count).              |
| `src/lib/staff/actions.ts`                                   | Create / update / set-active Server Actions.      |
| `src/lib/business-settings/actions.ts`                       | Timezone + cadence Server Actions.                |
| `src/app/(app)/settings/page.tsx`                            | Hub (#44).                                        |
| `src/app/(app)/settings/staff/page.tsx`                      | Staff list (#53).                                 |
| `src/app/(app)/settings/staff/staff-form-dialog.tsx`         | Create/edit dialog.                               |
| `src/app/(app)/settings/staff/staff-row-actions.tsx`         | Edit + activate/deactivate.                       |
| `src/app/(app)/settings/business/page.tsx`                   | Business settings (#56).                          |
| `src/app/(app)/settings/business/business-settings-form.tsx` | Timezone + cadence forms.                         |
| `supabase/migrations/20260830120000_staff_settings_rls.sql`  | Staff write grants + policies.                    |
| `tests/integration/staff.integration.test.ts`                | RLS + deactivation behaviour.                     |

**Modify:** `src/lib/roles.ts` (+`editBusinessSettings`), `src/lib/roles.test.ts`, `src/lib/auth/types.ts` + `current-user.ts` (+`timezone`), `src/lib/sprints/actions.ts`, `src/lib/dashboard/queries.ts`, `src/app/(app)/page.tsx`, `messages/he.json`, `src/lib/supabase/database.types.ts` (generated).

---

## Task 1: Add the `editBusinessSettings` permission

**Files:**

- Modify: `src/lib/roles.ts`
- Test: `src/lib/roles.test.ts`

- [ ] **Step 1: Write the failing test**

Append inside the existing `describe("can", ...)` block in `src/lib/roles.test.ts`:

```ts
it("restricts editBusinessSettings to admin", () => {
  expect(can("admin", "editBusinessSettings")).toBe(true);
  expect(can("manager", "editBusinessSettings")).toBe(false);
  expect(can("secretary", "editBusinessSettings")).toBe(false);
  expect(can("worker", "editBusinessSettings")).toBe(false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/roles.test.ts`
Expected: FAIL — TypeScript/assertion error, `editBusinessSettings` is not a `Permission`.

- [ ] **Step 3: Add the permission**

In `src/lib/roles.ts`, add `"editBusinessSettings"` to the `PERMISSIONS` array (after `"editBranding"`). `admin` already receives `new Set(PERMISSIONS)` so it needs no change; do **not** add it to `manager`, `secretary`, or `worker`.

```ts
export const PERMISSIONS = [
  "manageUsers",
  "editBranding",
  "editBusinessSettings",
  "manageStaff",
  // ...unchanged
] as const;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/roles.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/roles.ts src/lib/roles.test.ts
git commit -m "feat(roles): add admin-only editBusinessSettings permission"
```

---

## Task 2: Pure business-timezone helpers

**Files:**

- Create: `src/lib/time/business-time.ts`
- Test: `src/lib/time/business-time.test.ts`

Israel is UTC+2 in winter (IST) and UTC+3 in summer (IDT). The tests below pin both.

- [ ] **Step 1: Write the failing test**

Create `src/lib/time/business-time.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import {
  addCalendarDays,
  businessDateString,
  businessDayStart,
} from "./business-time";

const JERUSALEM = "Asia/Jerusalem";

describe("businessDateString", () => {
  it("returns the date as the business sees it, not UTC", () => {
    // 22:30 UTC in summer is already 01:30 the next day in Israel (UTC+3).
    // This is the original bug: a UTC slice reports the previous day.
    const at = new Date("2026-08-27T22:30:00Z");

    expect(businessDateString(at, JERUSALEM)).toBe("2026-08-28");
    expect(businessDateString(at, "UTC")).toBe("2026-08-27");
  });

  it("handles winter time, when Israel is UTC+2", () => {
    const at = new Date("2026-01-15T22:30:00Z");

    expect(businessDateString(at, JERUSALEM)).toBe("2026-01-16");
  });

  it("is not hardcoded to Israel", () => {
    const at = new Date("2026-08-27T22:30:00Z");

    expect(businessDateString(at, "America/New_York")).toBe("2026-08-27");
    expect(businessDateString(at, "Pacific/Auckland")).toBe("2026-08-28");
  });
});

describe("businessDayStart", () => {
  it("returns the UTC instant of local midnight in summer (UTC+3)", () => {
    const at = new Date("2026-08-27T22:30:00Z"); // local 2026-08-28 01:30

    expect(businessDayStart(at, JERUSALEM).toISOString()).toBe(
      "2026-08-27T21:00:00.000Z",
    );
  });

  it("returns the UTC instant of local midnight in winter (UTC+2)", () => {
    const at = new Date("2026-01-16T09:00:00Z");

    expect(businessDayStart(at, JERUSALEM).toISOString()).toBe(
      "2026-01-15T22:00:00.000Z",
    );
  });

  it("matches the instant itself for UTC", () => {
    const at = new Date("2026-08-27T22:30:00Z");

    expect(businessDayStart(at, "UTC").toISOString()).toBe(
      "2026-08-27T00:00:00.000Z",
    );
  });
});

describe("addCalendarDays", () => {
  it("adds days within a month", () => {
    expect(addCalendarDays("2026-08-23", 7)).toBe("2026-08-30");
  });

  it("rolls over month and year boundaries", () => {
    expect(addCalendarDays("2026-08-30", 7)).toBe("2026-09-06");
    expect(addCalendarDays("2026-12-28", 7)).toBe("2027-01-04");
  });

  it("handles a leap day", () => {
    expect(addCalendarDays("2028-02-28", 1)).toBe("2028-02-29");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/time/business-time.test.ts`
Expected: FAIL — cannot resolve `./business-time`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/time/business-time.ts`:

```ts
/**
 * Date arithmetic in a tenant's own timezone (`businesses.timezone`).
 *
 * Pure and framework-agnostic, like `src/lib/availability.ts`: no Next.js and
 * no Supabase, so the timezone rules are directly unit-testable.
 *
 * The whole point is to stop using the *server's* clock for questions that
 * are about the *salon's* day. `new Date().toISOString().slice(0, 10)` is
 * UTC, so for anyone east of Greenwich it reports yesterday late in the
 * evening -- which is why a sprint created after midnight in Israel used to
 * start on the wrong date.
 */

/** 'YYYY-MM-DD' as seen in `timeZone`. `en-CA` formats in ISO order. */
export function businessDateString(now: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/**
 * How far `timeZone` is from UTC at a given instant, in milliseconds.
 * Derived by formatting the instant *as* that zone's wall clock and reading
 * it back as if it were UTC -- the difference is the offset, DST included.
 */
function zoneOffsetMs(at: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(at);

  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? "0");

  const asIfUtc = Date.UTC(
    value("year"),
    value("month") - 1,
    value("day"),
    value("hour"),
    value("minute"),
    value("second"),
  );
  return asIfUtc - at.getTime();
}

/** The UTC instant at which the business's current day began. */
export function businessDayStart(now: Date, timeZone: string): Date {
  const [year, month, day] = businessDateString(now, timeZone)
    .split("-")
    .map(Number);
  const midnightAsIfUtc = Date.UTC(year, month - 1, day);
  // Offset is sampled at that midnight, not at `now`, so a day that begins
  // before a DST change still resolves to its own local midnight.
  const offset = zoneOffsetMs(new Date(midnightAsIfUtc), timeZone);
  return new Date(midnightAsIfUtc - offset);
}

/** Calendar-safe day arithmetic on a 'YYYY-MM-DD' string. */
export function addCalendarDays(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day));
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted.toISOString().slice(0, 10);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/time/business-time.test.ts`
Expected: PASS (13 assertions across 9 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/time/business-time.ts src/lib/time/business-time.test.ts
git commit -m "feat(time): pure business-timezone date helpers"
```

---

## Task 3: Carry the business timezone on `CurrentUser`

**Files:**

- Modify: `src/lib/auth/types.ts`, `src/lib/auth/current-user.ts`
- Test: `tests/integration/current-user.integration.test.ts`

`getCurrentUserFromClient` already selects the `businesses` row, so this adds a column to an existing query — no new round trip.

The test goes in the **integration** suite, not `src/lib/auth/current-user.test.ts`. That unit file deliberately covers only the pure functions (`needsBootstrap`, `landingPathForRole`); `getCurrentUserFromClient` needs a real Supabase client, and faking one here would be testing the fake rather than the query.

- [ ] **Step 1: Write the failing test**

Add inside the existing `describe("getCurrentUserFromClient", ...)` block in `tests/integration/current-user.integration.test.ts`:

```ts
it("carries the business timezone, defaulting when the tenant never set one", async () => {
  const user = await getCurrentUserFromClient(worker.client);

  // `businesses.timezone` has a schema default, so a tenant that never
  // opened Settings still resolves to a usable IANA zone rather than
  // undefined -- every date computation depends on this being present.
  expect(user?.timezone).toBeTruthy();
  expect(
    () => new Intl.DateTimeFormat("en-CA", { timeZone: user!.timezone }),
  ).not.toThrow();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run --config vitest.integration.config.mts tests/integration/current-user.integration.test.ts`
Expected: FAIL — `timezone` does not exist on `CurrentUser` (type error), or is `undefined`.

Requires local Supabase (`colima start`, then `npx supabase start`).

- [ ] **Step 3: Implement**

In `src/lib/auth/types.ts` add to `CurrentUser`:

```ts
businessId: string;
businessName: string;
/** IANA zone from `businesses.timezone`; drives "today" and sprint dates. */
timezone: string;
role: Role;
```

In `src/lib/auth/current-user.ts` change the select and the return:

```ts
const { data: business } = await supabase
  .from("businesses")
  .select("id, name, timezone")
  .eq("id", membership.business_id)
  .maybeSingle();
```

```ts
    businessId: business.id,
    businessName: business.name,
    timezone: business.timezone,
    role: membership.role,
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx tsc --noEmit && npm run test && npm run test:integration`
Expected: no type errors; all unit and integration tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth/types.ts src/lib/auth/current-user.ts tests/integration/current-user.integration.test.ts
git commit -m "feat(auth): expose the business timezone on CurrentUser"
```

---

## Task 4: Use the business timezone for sprint dates and "today"

**Files:**

- Modify: `src/lib/sprints/actions.ts:46-54`, `src/lib/dashboard/queries.ts:191-208`, `src/app/(app)/page.tsx`

This is the bug fix. No new test file: Task 2 covers the logic, and these are thin call sites that `tsc` and the existing integration suite guard.

- [ ] **Step 1: Fix `createSprintAction`**

In `src/lib/sprints/actions.ts`, add the import and replace the date computation:

```ts
import { addCalendarDays, businessDateString } from "@/lib/time/business-time";
```

```ts
const cadenceDays = settings?.sprint_cadence_days ?? 7;

// The salon's calendar day, not the server's: a UTC slice reports
// yesterday for a sprint created after midnight in Israel.
const startsOn = businessDateString(new Date(), user.timezone);
const endsOn = addCalendarDays(startsOn, cadenceDays);

const { error } = await supabase.from("sprints").insert({
  business_id: user.businessId,
  name: name?.trim() || null,
  starts_on: startsOn,
  ends_on: endsOn,
  status: "active",
});
```

Delete the old `const startsOn = new Date(); const endsOn = ...; endsOn.setDate(...)` block.

- [ ] **Step 2: Fix `countCompletedToday`**

In `src/lib/dashboard/queries.ts`, import the helper and thread a `timezone` parameter through `fetchWorkerDashboard` → `countCompletedToday`:

```ts
import { businessDayStart } from "@/lib/time/business-time";
```

```ts
async function countCompletedToday(
  supabase: SupabaseClient<Database>,
  businessId: string,
  staffMemberId: string,
  timezone: string,
): Promise<number> {
  // The salon's midnight, not the server's.
  const startOfToday = businessDayStart(new Date(), timezone);

  const { count, error } = await supabase
    .from("runtime_tasks")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId)
    .eq("assigned_staff_member_id", staffMemberId)
    .eq("status", "done")
    .gte("completed_at", startOfToday.toISOString());
  if (error) throw error;
  return count ?? 0;
}
```

Update `fetchWorkerDashboard`'s signature to accept `timezone: string` and pass it to `countCompletedToday`.

- [ ] **Step 3: Update the caller**

In `src/app/(app)/page.tsx`, pass `user.timezone` to `fetchWorkerDashboard`.

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit && npm run test && npm run lint`
Expected: no type errors, all tests pass, no lint errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/sprints/actions.ts src/lib/dashboard/queries.ts "src/app/(app)/page.tsx"
git commit -m "fix(sprints,dashboard): use the business timezone for dates and today"
```

---

## Task 5: Migration — staff write grants and policies

**Files:**

- Create: `supabase/migrations/20260830120000_staff_settings_rls.sql`
- Modify: `src/lib/supabase/database.types.ts` (generated)

- [ ] **Step 1: Write the migration**

```sql
-- Settings slice 1 (screen inventory #53) -- the staff-members editor.
-- 20260803210100_work_definition_rls.sql granted SELECT only, noting that
-- write policies land "alongside that editor slice". This is that slice.
--
-- INSERT and UPDATE only, never DELETE. Removing a staff member is
-- deactivation (`is_active = false`): `staff_members.id` is referenced by
-- runtime_tasks.assigned_staff_member_id / approver_staff_member_id,
-- missing_items.responsible_staff_member_id and
-- task_types.default_staff_member_id, all `on delete set null` -- a hard
-- delete would silently erase who did the work on already-completed tasks,
-- contradicting the snapshot principle (architecture §5.1) and the audit
-- trail (ADR 0004). Withholding the grant makes that structural rather than
-- a convention a future Server Action could quietly break.
--
-- As everywhere since Slice 4, RLS enforces tenant isolation only; *who* may
-- edit staff is enforced in the app layer (`manageStaff` in src/lib/roles.ts).

grant insert, update on public.staff_members to authenticated;

create policy "staff_members_insert_members"
  on public.staff_members
  for insert
  to authenticated
  with check (public.is_business_member(business_id));

create policy "staff_members_update_members"
  on public.staff_members
  for update
  to authenticated
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));
```

- [ ] **Step 2: Apply and regenerate types**

Requires local Supabase (`colima start`, then `npx supabase start`).

Run:

```bash
npx supabase migration up --local
npm run gen:types
```

Expected: migration applies; `git diff src/lib/supabase/database.types.ts` shows no schema change (grants and policies are not in the generated types) — that is correct, the file may be unchanged.

- [ ] **Step 3: Verify the grant is exactly right**

Run:

```bash
npx supabase migration list --local
```

Expected: `20260830120000` appears in both local and remote columns.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260830120000_staff_settings_rls.sql src/lib/supabase/database.types.ts
git commit -m "feat(db): staff_members insert/update grants and policies (no delete)"
```

---

## Task 6: Staff validation

**Files:**

- Create: `src/lib/staff/validation.ts`
- Test: `src/lib/staff/validation.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";

import {
  hasFieldErrors,
  validateStaffInput,
  type StaffInput,
} from "./validation";

function input(overrides: Partial<StaffInput> = {}): StaffInput {
  return {
    fullName: "דנה כהן",
    title: "",
    defaultWorkStageId: "",
    ...overrides,
  };
}

describe("validateStaffInput", () => {
  it("accepts a name alone -- everything else is optional", () => {
    expect(validateStaffInput(input())).toEqual({});
  });

  it("requires a full name", () => {
    expect(validateStaffInput(input({ fullName: "" })).fullName).toBe(
      "required",
    );
  });

  it("treats whitespace as empty", () => {
    expect(validateStaffInput(input({ fullName: "   " })).fullName).toBe(
      "required",
    );
  });

  it("rejects a name longer than the column allows", () => {
    expect(
      validateStaffInput(input({ fullName: "א".repeat(121) })).fullName,
    ).toBe("tooLong");
  });
});

describe("hasFieldErrors", () => {
  it("is false for a clean result", () => {
    expect(hasFieldErrors({})).toBe(false);
  });

  it("is true once any field failed", () => {
    expect(hasFieldErrors({ fullName: "required" })).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/staff/validation.test.ts`
Expected: FAIL — cannot resolve `./validation`.

- [ ] **Step 3: Implement**

Create `src/lib/staff/validation.ts`:

```ts
/**
 * Pure validation for staff create/edit input (screen inventory #53).
 * Framework-agnostic, mirroring `src/lib/customers/validation.ts`.
 *
 * Only `full_name` is required: `title` and `default_work_stage_id` are
 * nullable in the schema, and `user_id` is not editable here (linking a
 * login to a staff member is screen #54).
 */

const MAX_NAME_LENGTH = 120;

export type StaffInput = {
  fullName: string;
  title: string;
  defaultWorkStageId: string;
};

export type StaffFieldErrors = Partial<
  Record<keyof StaffInput, "required" | "tooLong">
>;

export function validateStaffInput(input: StaffInput): StaffFieldErrors {
  const errors: StaffFieldErrors = {};

  const name = input.fullName.trim();
  if (!name) {
    errors.fullName = "required";
  } else if (name.length > MAX_NAME_LENGTH) {
    errors.fullName = "tooLong";
  }

  return errors;
}

export function hasFieldErrors(errors: StaffFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/staff/validation.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/staff/validation.ts src/lib/staff/validation.test.ts
git commit -m "feat(staff): pure validation for the staff editor"
```

---

## Task 7: Staff queries

**Files:**

- Create: `src/lib/staff/queries.ts`

No unit test: this is a thin Supabase read, covered by the integration test in Task 11 — the same boundary `src/lib/customers/queries.ts` draws.

- [ ] **Step 1: Implement**

```ts
import type { SupabaseClient } from "@supabase/supabase-js";

import { LIVE_STATUSES } from "@/lib/board/queries";
import type { Database, Tables } from "@/lib/supabase/database.types";

export type StaffMember = Tables<"staff_members">;

export type StaffListItem = StaffMember & {
  workStageName: string | null;
  linkedUserName: string | null;
};

/**
 * Staff for the settings list (screen inventory #53), enriched with the
 * display names the table shows. Batched rather than embedded, matching
 * `src/lib/board/queries.ts`.
 *
 * Returns inactive members too -- the list has a "show inactive" toggle and
 * filters client-side, because the set is small (a salon has tens of staff,
 * not thousands) and it keeps the toggle instant.
 */
export async function listStaffMembers(
  supabase: SupabaseClient<Database>,
  businessId: string,
): Promise<StaffListItem[]> {
  const { data: staff, error } = await supabase
    .from("staff_members")
    .select("*")
    .eq("business_id", businessId)
    .order("is_active", { ascending: false })
    .order("full_name", { ascending: true });
  if (error) throw error;

  const rows = staff ?? [];
  const stageIds = Array.from(
    new Set(
      rows
        .map((s) => s.default_work_stage_id)
        .filter((id): id is string => Boolean(id)),
    ),
  );
  const userIds = Array.from(
    new Set(
      rows.map((s) => s.user_id).filter((id): id is string => Boolean(id)),
    ),
  );

  const [stagesResult, profilesResult] = await Promise.all([
    stageIds.length > 0
      ? supabase.from("work_stages").select("id, name").in("id", stageIds)
      : Promise.resolve({ data: [], error: null }),
    userIds.length > 0
      ? supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", userIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (stagesResult.error) throw stagesResult.error;
  if (profilesResult.error) throw profilesResult.error;

  const stageNameById = new Map(
    (stagesResult.data ?? []).map((s) => [s.id, s.name]),
  );
  const profileById = new Map(
    (profilesResult.data ?? []).map((p) => [p.id, p]),
  );

  return rows.map((member) => {
    const profile = member.user_id
      ? profileById.get(member.user_id)
      : undefined;
    return {
      ...member,
      workStageName: member.default_work_stage_id
        ? (stageNameById.get(member.default_work_stage_id) ?? null)
        : null,
      linkedUserName: profile ? (profile.full_name ?? profile.email) : null,
    };
  });
}

/**
 * How many non-terminal tasks a staff member still holds. Shown in the
 * deactivate dialog: deactivation removes them from assignee pickers but
 * leaves these assigned, which is not self-evident.
 */
export async function countOpenTasksForStaff(
  supabase: SupabaseClient<Database>,
  businessId: string,
  staffMemberId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("runtime_tasks")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId)
    .eq("assigned_staff_member_id", staffMemberId)
    .in("status", LIVE_STATUSES);
  if (error) throw error;
  return count ?? 0;
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/staff/queries.ts
git commit -m "feat(staff): list and open-task-count queries"
```

---

## Task 8: Staff Server Actions

**Files:**

- Create: `src/lib/staff/actions.ts`

- [ ] **Step 1: Implement**

```ts
"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/server";
import { can } from "@/lib/roles";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  hasFieldErrors,
  validateStaffInput,
  type StaffFieldErrors,
  type StaffInput,
} from "./validation";

export type StaffActionResult =
  | { success: true }
  | { success: false; errors: StaffFieldErrors; formError?: string };

function readInput(formData: FormData): StaffInput {
  return {
    fullName: String(formData.get("fullName") ?? ""),
    title: String(formData.get("title") ?? ""),
    defaultWorkStageId: String(formData.get("defaultWorkStageId") ?? ""),
  };
}

/** The authoritative permission check (RLS only enforces tenant isolation). */
async function requireStaffManager() {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "manageStaff")) return null;
  return user;
}

export async function createStaffMemberAction(
  formData: FormData,
): Promise<StaffActionResult> {
  const user = await requireStaffManager();
  if (!user) return { success: false, errors: {}, formError: "forbidden" };

  const input = readInput(formData);
  const errors = validateStaffInput(input);
  if (hasFieldErrors(errors)) return { success: false, errors };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("staff_members").insert({
    business_id: user.businessId,
    full_name: input.fullName.trim(),
    title: input.title.trim() || null,
    default_work_stage_id: input.defaultWorkStageId || null,
  });
  if (error) return { success: false, errors: {}, formError: "generic" };

  revalidatePath("/settings/staff");
  return { success: true };
}

export async function updateStaffMemberAction(
  id: string,
  formData: FormData,
): Promise<StaffActionResult> {
  const user = await requireStaffManager();
  if (!user) return { success: false, errors: {}, formError: "forbidden" };

  const input = readInput(formData);
  const errors = validateStaffInput(input);
  if (hasFieldErrors(errors)) return { success: false, errors };

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("staff_members")
    .update({
      full_name: input.fullName.trim(),
      title: input.title.trim() || null,
      default_work_stage_id: input.defaultWorkStageId || null,
    })
    .eq("id", id)
    .eq("business_id", user.businessId)
    .select("id");
  if (error) return { success: false, errors: {}, formError: "generic" };
  // PostgREST reports no error when a filtered update matches nothing, so the
  // row count is the only signal that anything actually changed.
  if (!data || data.length === 0) {
    return { success: false, errors: {}, formError: "notFound" };
  }

  revalidatePath("/settings/staff");
  return { success: true };
}

/**
 * Deactivate / reactivate. There is deliberately no delete: the DB withholds
 * the grant (20260830120000_staff_settings_rls.sql) because deleting would
 * null out `assigned_staff_member_id` on completed tasks and erase who did
 * the work. Existing assignments are left untouched -- the staff member just
 * stops appearing in assignee pickers, which already filter `is_active`.
 */
export async function setStaffMemberActiveAction(
  id: string,
  isActive: boolean,
): Promise<StaffActionResult> {
  const user = await requireStaffManager();
  if (!user) return { success: false, errors: {}, formError: "forbidden" };

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("staff_members")
    .update({ is_active: isActive })
    .eq("id", id)
    .eq("business_id", user.businessId)
    .select("id");
  if (error) return { success: false, errors: {}, formError: "generic" };
  if (!data || data.length === 0) {
    return { success: false, errors: {}, formError: "notFound" };
  }

  revalidatePath("/settings/staff");
  revalidatePath("/board");
  revalidatePath("/sprint");
  return { success: true };
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit && npm run lint`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/lib/staff/actions.ts
git commit -m "feat(staff): create/update/set-active Server Actions"
```

---

## Task 9: Business-settings Server Actions

**Files:**

- Create: `src/lib/business-settings/actions.ts`

`setSprintCadenceAction` already exists in `src/lib/sprints/actions.ts` and stays there — the settings page imports it. This module adds only the timezone action.

- [ ] **Step 1: Implement**

```ts
"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/server";
import { can } from "@/lib/roles";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type BusinessSettingsResult =
  { success: true } | { success: false; error: string };

/**
 * Timezone is admin-only in the app layer, mirroring the RLS that Slice 1a
 * already put on `businesses` (`businesses_update_admins`). Both gates exist
 * on purpose: RLS is the guardrail, the app check is the real permission.
 */
export async function setBusinessTimezoneAction(
  timezone: string,
): Promise<BusinessSettingsResult> {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "editBusinessSettings")) {
    return { success: false, error: "forbidden" };
  }

  // Reject anything the runtime does not recognise, so a hand-crafted POST
  // cannot store a value that later breaks every date computation.
  if (!isValidTimeZone(timezone)) {
    return { success: false, error: "invalidTimezone" };
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("businesses")
    .update({ timezone })
    .eq("id", user.businessId)
    .select("id");
  if (error) return { success: false, error: "generic" };
  if (!data || data.length === 0) {
    return { success: false, error: "forbidden" };
  }

  revalidatePath("/settings/business");
  revalidatePath("/");
  revalidatePath("/sprint");
  return { success: true };
}

function isValidTimeZone(timezone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit && npm run lint`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/lib/business-settings/actions.ts
git commit -m "feat(settings): admin-only business timezone action"
```

---

## Task 10: i18n messages

**Files:**

- Modify: `messages/he.json`

Every string below is required by Tasks 11–13. `src/i18n/messages.test.ts` guards against duplicate keys, so run the unit suite after editing.

- [ ] **Step 1: Replace the existing `pages.settings` block**

Find `"settings"` under `pages` (currently `{ "title": ... }`) and replace it with:

```json
"settings": {
  "title": "הגדרות",
  "subtitle": "הגדרות המכון",
  "sections": {
    "staff": {
      "title": "אנשי צוות",
      "description": "ניהול העובדים שניתן לשייך אליהם משימות."
    },
    "business": {
      "title": "הגדרות עסק",
      "description": "אזור זמן וקצב הספרינט."
    }
  },
  "staff": {
    "title": "אנשי צוות",
    "subtitle": "ניהול הצוות של המכון",
    "add": "איש/אשת צוות חדש/ה",
    "showInactive": "הצגת לא פעילים",
    "emptyTitle": "אין עדיין אנשי צוות",
    "emptyDescription": "הוסיפו איש/אשת צוות כדי שניתן יהיה לשייך משימות.",
    "columns": {
      "name": "שם",
      "title": "תפקיד",
      "stage": "שלב ברירת מחדל",
      "user": "משתמש מקושר",
      "status": "סטטוס",
      "actions": "פעולות"
    },
    "status": { "active": "פעיל/ה", "inactive": "לא פעיל/ה" },
    "none": "—",
    "form": {
      "createTitle": "הוספת איש/אשת צוות",
      "editTitle": "עריכת פרטי איש/אשת צוות",
      "fullName": "שם מלא",
      "jobTitle": "תפקיד",
      "defaultStage": "שלב ברירת מחדל",
      "noStage": "ללא שלב",
      "cancel": "ביטול",
      "save": "שמירה",
      "saving": "שומר/ת...",
      "errors": {
        "required": "שדה חובה.",
        "tooLong": "השם ארוך מדי.",
        "forbidden": "אין לכם הרשאה לפעולה זו.",
        "notFound": "הרשומה לא נמצאה.",
        "generic": "משהו השתבש. נסו שוב."
      }
    },
    "deactivate": {
      "action": "השבתה",
      "title": "השבתת איש/אשת צוות",
      "confirm": "לאחר ההשבתה לא ניתן יהיה לשייך משימות חדשות לעובד/ת זה/זו.",
      "openTasks": "משימות פתוחות שיישארו משויכות: {count}",
      "keepsHistory": "המשימות הקיימות וההיסטוריה נשמרות.",
      "cancel": "ביטול",
      "submit": "השבתה",
      "submitting": "משבית/ה..."
    },
    "reactivate": { "action": "הפעלה מחדש" }
  },
  "business": {
    "title": "הגדרות עסק",
    "subtitle": "אזור זמן וקצב הספרינט",
    "timezone": {
      "label": "אזור זמן",
      "help": "קובע את התאריכים של הספרינט ואת חישוב \"היום\" בדשבורד.",
      "save": "שמירה",
      "saving": "שומר/ת...",
      "saved": "אזור הזמן עודכן.",
      "errors": {
        "forbidden": "רק מנהל/ת מערכת יכול/ה לשנות אזור זמן.",
        "invalidTimezone": "אזור זמן לא תקין.",
        "generic": "משהו השתבש. נסו שוב."
      }
    },
    "cadence": {
      "label": "אורך ספרינט (בימים)",
      "help": "משמש כברירת מחדל ביצירת ספרינט חדש.",
      "save": "שמירה",
      "saving": "שומר/ת...",
      "saved": "קצב הספרינט עודכן.",
      "errors": {
        "invalidCadence": "יש להזין מספר ימים חיובי.",
        "generic": "משהו השתבש. נסו שוב."
      }
    }
  }
}
```

- [ ] **Step 2: Verify the catalog is still valid**

Run: `npx vitest run src/i18n/messages.test.ts`
Expected: PASS — no duplicate keys.

- [ ] **Step 3: Commit**

```bash
git add messages/he.json
git commit -m "feat(i18n): Hebrew copy for the settings screens"
```

---

## Task 11: Settings hub page (#44)

**Files:**

- Create: `src/app/(app)/settings/page.tsx`
- Modify: `src/app/(app)/settings/page.tsx` replaces the existing placeholder at that path

- [ ] **Step 1: Replace the placeholder**

```tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { Building2, Users, type LucideIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/server";
import { can, type Permission, type Role } from "@/lib/roles";

type Section = {
  key: "staff" | "business";
  href: string;
  icon: LucideIcon;
  /** Any one of these is enough to open the section. */
  permissions: Permission[];
};

// Only sections the role can actually open are rendered, so the hub is never
// a list of dead ends (docs/ui/information-architecture.md: manager gets
// operational settings, admin gets all).
const SECTIONS: Section[] = [
  {
    key: "staff",
    href: "/settings/staff",
    icon: Users,
    permissions: ["manageStaff"],
  },
  {
    key: "business",
    href: "/settings/business",
    icon: Building2,
    permissions: ["planSprint", "editBusinessSettings"],
  },
];

export function visibleSections(role: Role): Section[] {
  return SECTIONS.filter((section) =>
    section.permissions.some((permission) => can(role, permission)),
  );
}

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const sections = visibleSections(user.role);
  if (sections.length === 0) redirect("/");

  const t = await getTranslations("pages.settings");

  return (
    <div>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <div className="grid gap-3 sm:grid-cols-2">
        {sections.map((section) => (
          <Link key={section.key} href={section.href} className="block">
            <Card className="h-full transition-colors hover:border-line-strong">
              <CardContent className="flex items-start gap-3 p-4">
                <section.icon
                  className="mt-0.5 size-5 shrink-0 text-muted"
                  aria-hidden
                />
                <div>
                  <CardTitle className="text-base">
                    {t(`sections.${section.key}.title`)}
                  </CardTitle>
                  <p className="mt-1 text-body text-muted">
                    {t(`sections.${section.key}.description`)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

`PageHeader` takes `{ title, subtitle?, actions? }` and `EmptyState` takes `{ icon?, title, description?, action? }` — both verified against the current components.

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: clean; `/settings` appears in the build route list.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(app)/settings/page.tsx"
git commit -m "feat(settings): role-filtered settings hub (screen #44)"
```

---

## Task 12: Staff settings screen (#53)

**Files:**

- Create: `src/app/(app)/settings/staff/page.tsx`, `staff-form-dialog.tsx`, `staff-row-actions.tsx`

- [ ] **Step 1: Build the page**

`src/app/(app)/settings/staff/page.tsx` — a Server Component that guards on `manageStaff`, loads staff and active work stages, and renders the table. Model it on `src/app/(app)/customers/page.tsx` (read that file first and follow its structure exactly: `getCurrentUser` → `redirect("/login")` → `can()` → `redirect("/")` → `createServerSupabaseClient()` → query → view component).

```tsx
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCurrentUser } from "@/lib/auth/server";
import { can } from "@/lib/roles";
import { countOpenTasksForStaff, listStaffMembers } from "@/lib/staff/queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { fetchActiveWorkStages } from "@/lib/work-orders/queries";
import { StaffFormDialog } from "./staff-form-dialog";
import { StaffRowActions } from "./staff-row-actions";

type SearchParams = { [key: string]: string | string[] | undefined };

export default async function StaffSettingsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!can(user.role, "manageStaff")) redirect("/");

  const showInactive = searchParams.inactive === "1";
  const supabase = await createServerSupabaseClient();
  const [staff, stages] = await Promise.all([
    listStaffMembers(supabase, user.businessId),
    fetchActiveWorkStages(supabase, user.businessId),
  ]);
  const visible = showInactive ? staff : staff.filter((s) => s.is_active);

  // The deactivate dialog states how many tasks stay assigned, so the count
  // is resolved here (server-side) and passed down. Only active members can
  // be deactivated, so inactive rows don't need one.
  const openTaskCounts = new Map(
    await Promise.all(
      visible
        .filter((member) => member.is_active)
        .map(
          async (member) =>
            [
              member.id,
              await countOpenTasksForStaff(
                supabase,
                user.businessId,
                member.id,
              ),
            ] as const,
        ),
    ),
  );

  const t = await getTranslations("pages.settings.staff");

  return (
    <div>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      {/* "show inactive" is a plain link so it works without JS and keeps
          the URL shareable, like the other list filters. */}
      <div className="mb-4 flex items-center justify-between gap-2">
        <StaffFormDialog stages={stages} />
        <a
          href={showInactive ? "/settings/staff" : "/settings/staff?inactive=1"}
          className="text-body text-muted underline-offset-4 hover:underline"
        >
          {t("showInactive")}
        </a>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title={t("emptyTitle")}
          description={t("emptyDescription")}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("columns.name")}</TableHead>
              <TableHead>{t("columns.title")}</TableHead>
              <TableHead>{t("columns.stage")}</TableHead>
              <TableHead>{t("columns.user")}</TableHead>
              <TableHead>{t("columns.status")}</TableHead>
              <TableHead>{t("columns.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((member) => (
              <TableRow
                key={member.id}
                className={member.is_active ? "" : "opacity-60"}
              >
                <TableCell>{member.full_name}</TableCell>
                <TableCell>{member.title ?? t("none")}</TableCell>
                <TableCell>{member.workStageName ?? t("none")}</TableCell>
                <TableCell>{member.linkedUserName ?? t("none")}</TableCell>
                <TableCell>
                  {member.is_active ? t("status.active") : t("status.inactive")}
                </TableCell>
                <TableCell>
                  <StaffRowActions
                    member={member}
                    stages={stages}
                    openTaskCount={openTaskCounts.get(member.id) ?? 0}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
```

Confirm `EmptyState`'s props against `src/components/ui/empty-state.tsx` before using it.

- [ ] **Step 2: Build the form dialog**

`staff-form-dialog.tsx` — a `"use client"` component. Read `src/app/(app)/customers/customer-form-dialog.tsx` first and mirror its shape: `useState` for open, `useTransition` for pending, `FormData` submit, field errors from the action result keyed to `t("form.errors.<code>")`. Props: `stages: { id: string; name: string }[]` and optional `member?: StaffListItem` (present = edit mode, calls `updateStaffMemberAction(member.id, formData)`; absent = create, calls `createStaffMemberAction(formData)`).

Fields: `fullName` (`Input`, required), `title` (`Input`), `defaultWorkStageId` (`select` with a `t("form.noStage")` empty option, then one `option` per stage).

- [ ] **Step 3: Build the row actions**

`staff-row-actions.tsx` — a `"use client"` component with an edit trigger (reuses `StaffFormDialog` in edit mode) and an activate/deactivate control.

Props: `member: StaffListItem`, `stages: { id: string; name: string }[]`, `openTaskCount: number`.

For an **active** member, deactivating opens a confirm `Dialog` showing `t("deactivate.confirm")`, `t("deactivate.openTasks", { count: openTaskCount })` and `t("deactivate.keepsHistory")`, then calls `setStaffMemberActiveAction(member.id, false)`. The count arrives as a prop from the page (Step 1) — no client-side query.

For an **inactive** member, a plain `t("reactivate.action")` button calls `setStaffMemberActiveAction(member.id, true)` with no confirmation — reactivating is not destructive.

Both paths call `router.refresh()` on success and surface `t("form.errors.<code>")` on failure.

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit && npm run lint && npm run test && npm run build`
Expected: all clean, 129+ tests pass.

- [ ] **Step 5: Verify in the browser**

Start the dev server, sign in as `admin@wiggy.local` / `wiggy-dev-password`, and visit `/settings/staff`. Confirm: three seeded staff appear; creating one adds a row; editing persists; deactivating shows the open-task count and moves the row out of the default view; "show inactive" reveals it; reactivating restores it. Then open `/board` and confirm a deactivated member no longer appears in the assignee picker while their existing task assignments are unchanged.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(app)/settings/staff"
git commit -m "feat(settings): staff members editor (screen #53)"
```

---

## Task 13: Business settings screen (#56)

**Files:**

- Create: `src/app/(app)/settings/business/page.tsx`, `business-settings-form.tsx`

- [ ] **Step 1: Build the page**

```tsx
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/layout/page-header";
import { getCurrentUser } from "@/lib/auth/server";
import { can } from "@/lib/roles";
import { fetchSprintCadenceDays } from "@/lib/sprints/queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { BusinessSettingsForm } from "./business-settings-form";

export default async function BusinessSettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const canEditBusiness = can(user.role, "editBusinessSettings");
  const canEditCadence = can(user.role, "planSprint");
  if (!canEditBusiness && !canEditCadence) redirect("/");

  const supabase = await createServerSupabaseClient();
  const cadenceDays = await fetchSprintCadenceDays(supabase, user.businessId);

  const t = await getTranslations("pages.settings.business");

  return (
    <div>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <BusinessSettingsForm
        timezone={user.timezone}
        cadenceDays={cadenceDays}
        canEditTimezone={canEditBusiness}
        canEditCadence={canEditCadence}
        timezones={Intl.supportedValuesOf("timeZone")}
      />
    </div>
  );
}
```

`Intl.supportedValuesOf` is evaluated on the server and the list passed down, so no browser-support question arises.

- [ ] **Step 2: Build the form**

`business-settings-form.tsx` — `"use client"`, two independent `Card` sections, each rendered only when its `canEdit*` prop is true.

Timezone: a `select` of `timezones` defaulting to the current `timezone`, plus a save button calling `setBusinessTimezoneAction(value)`. Cadence: a `number` input (min 1) and a save button calling the existing `setSprintCadenceAction(days)` imported from `@/lib/sprints/actions`.

Each section keeps its own `useTransition` pending state and its own success/error message, so saving one never blanks the other. On success show `t("timezone.saved")` / `t("cadence.saved")` and call `router.refresh()`; on failure show `t("timezone.errors.<code>")` / `t("cadence.errors.<code>")`.

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: clean.

- [ ] **Step 4: Verify in the browser**

As `admin@wiggy.local`, open `/settings/business`: both sections render. Change the timezone, save, then create a sprint from `/sprint` and confirm `starts_on` matches the salon's local date. As `worker@wiggy.local`, confirm `/settings` and `/settings/business` redirect to `/`.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(app)/settings/business"
git commit -m "feat(settings): business timezone and sprint cadence (screen #56)"
```

---

## Task 14: Integration tests

**Files:**

- Create: `tests/integration/staff.integration.test.ts`

Requires local Supabase. Read `tests/integration/customers.integration.test.ts` first and reuse its tenant-seeding shape (two tenants, signed-in anon clients, `afterAll` cleanup).

- [ ] **Step 1: Write the tests**

Cover exactly these behaviours:

```ts
it("lets a member insert a staff row in their own business", async () => {
  /* ... */
});

it("rejects inserting a staff row into another tenant", async () => {
  const { error } = await tenantA.client.from("staff_members").insert({
    business_id: tenantB.businessId,
    full_name: "cross tenant",
  });

  expect(error).not.toBeNull();
});

it("rejects updating another tenant's staff row", async () => {
  const { data } = await tenantA.client
    .from("staff_members")
    .update({ full_name: "hijacked" })
    .eq("id", tenantBStaffId)
    .select("id");

  expect(data ?? []).toHaveLength(0);
});

it("does not grant delete to authenticated users", async () => {
  const { error } = await tenantA.client
    .from("staff_members")
    .delete()
    .eq("id", tenantAStaffId);

  // The migration deliberately withholds the DELETE grant: removal is
  // deactivation, so history keeps who did the work.
  expect(error).not.toBeNull();
});

it("keeps existing task assignments when a member is deactivated", async () => {
  await admin
    .from("staff_members")
    .update({ is_active: false })
    .eq("id", staffId);

  const { data } = await admin
    .from("runtime_tasks")
    .select("assigned_staff_member_id")
    .eq("id", taskId)
    .single();

  expect(data?.assigned_staff_member_id).toBe(staffId);
});
```

- [ ] **Step 2: Run them**

Run: `npm run test:integration`
Expected: all pass, including the pre-existing 57.

- [ ] **Step 3: Commit**

```bash
git add tests/integration/staff.integration.test.ts
git commit -m "test(staff): RLS boundaries and deactivation behaviour"
```

---

## Task 15: Documentation and final verification

**Files:**

- Modify: `docs/architecture.md`, `docs/ui/screen-inventory.md`, `AGENTS.md`

- [ ] **Step 1: Update `docs/architecture.md`**

In §4.1, annotate `businesses.timezone` as authoritative. Add a short subsection after §7.4:

```markdown
### 7.5 Business timezone

Dates that describe the salon's own day — a sprint's `starts_on`/`ends_on`, the dashboard's
"completed today" — resolve through `businesses.timezone`, never the server clock
(`src/lib/time/business-time.ts`). A UTC date slice reports the previous day for any tenant east of
Greenwich late in the evening. The zone travels on `CurrentUser.timezone`, resolved once per request
by `getCurrentUserFromClient`.
```

- [ ] **Step 2: Update `docs/ui/screen-inventory.md`**

Mark #44, #53 and #56 as built, keeping their `[config]` tag for the rest of section 8. For example: `44. Settings hub / admin home **[config]** — built`.

- [ ] **Step 3: Update `AGENTS.md`**

Add to the repo-state block: the first `[config]` slice shipped (#44/#53/#56); `staff_members` now has `insert`/`update` grants but deliberately **no** `delete`, because removal is deactivation; and `businesses.timezone` is now authoritative for sprint dates and "today".

- [ ] **Step 4: Full verification**

Run:

```bash
npx tsc --noEmit
npm run lint
npm run test
npm run test:integration
npm run build
```

Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add docs/architecture.md docs/ui/screen-inventory.md AGENTS.md
git commit -m "docs: record the settings slice and the business-timezone rule"
```

---

## Self-review notes

**Spec coverage.** Hub #44 → Task 11. Staff #53 → Tasks 6–8, 12, 14. Business settings #56 → Tasks 1, 9, 13. Timezone correctness → Tasks 2–4. Migration → Task 5. i18n → Task 10. Docs → Task 15. Locale exclusion and `user_id` display-only are honoured in Tasks 10/12.

**Naming consistency.** `businessDateString`, `businessDayStart`, `addCalendarDays`, `validateStaffInput`, `hasFieldErrors`, `listStaffMembers`, `countOpenTasksForStaff`, `createStaffMemberAction`, `updateStaffMemberAction`, `setStaffMemberActiveAction`, `setBusinessTimezoneAction` are each defined once and referenced consistently.

**Known follow-ups, deliberately out of scope.** Screens #45–#52, #54, #55, #57 each need their own spec. The `editBranding` permission already exists but stays unused until #55.
