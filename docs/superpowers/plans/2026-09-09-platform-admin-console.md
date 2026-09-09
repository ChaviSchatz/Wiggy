# Platform Admin Console Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an allowlisted platform admin create a new business (tenant) and invite its first
admin, from a route no salon user can reach — unblocking onboarding of the first real salon without
hand-running scripts against production.

**Architecture:** A new route group `src/app/(platform)/platform/` gated by a static email
allowlist (`PLATFORM_ADMIN_EMAILS`), completely separate from the tenant-scoped `(app)` shell and
its `memberships`-based roles. One server action (`createTenantAction`) does three idempotent
find-or-create steps against the service-role Supabase client: business row, invited/found admin
user, admin membership. Full design: `docs/superpowers/specs/2026-09-09-platform-admin-console-design.md`.

**Tech Stack:** Next.js App Router (Server Components + Server Actions), Supabase (Postgres, Auth
Admin API, service-role client), next-intl, Vitest.

---

## Before you start

Read `docs/superpowers/specs/2026-09-09-platform-admin-console-design.md` in full — this plan
implements it and assumes you know its reasoning (especially the pre-existing sign-in redirect loop
it fixes, and why the three provisioning steps are find-or-create rather than transactional).

Local dev needs Supabase running: `colima start` (Docker on this Mac), then `npx supabase start`.
Check `npx supabase status` first — migrations usually survive in the Docker volume, no reset
needed.

---

### Task 1: `isPlatformAdmin` — the allowlist check

**Files:**

- Create: `src/lib/platform-admin/is-platform-admin.ts`
- Test: `src/lib/platform-admin/is-platform-admin.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { isPlatformAdmin } from "./is-platform-admin";

describe("isPlatformAdmin", () => {
  const ORIGINAL_ENV = process.env.PLATFORM_ADMIN_EMAILS;

  beforeEach(() => {
    process.env.PLATFORM_ADMIN_EMAILS = "chava@wiggy.app, Team@Wiggy.app";
  });

  afterEach(() => {
    if (ORIGINAL_ENV === undefined) {
      delete process.env.PLATFORM_ADMIN_EMAILS;
    } else {
      process.env.PLATFORM_ADMIN_EMAILS = ORIGINAL_ENV;
    }
  });

  it("matches an email in the allowlist", () => {
    expect(isPlatformAdmin("chava@wiggy.app")).toBe(true);
  });

  it("matches case-insensitively, on both sides", () => {
    expect(isPlatformAdmin("CHAVA@WIGGY.APP")).toBe(true);
    expect(isPlatformAdmin("team@wiggy.app")).toBe(true);
  });

  it("rejects an email not in the allowlist", () => {
    expect(isPlatformAdmin("someone-else@example.com")).toBe(false);
  });

  it("rejects null, undefined, and empty string", () => {
    expect(isPlatformAdmin(null)).toBe(false);
    expect(isPlatformAdmin(undefined)).toBe(false);
    expect(isPlatformAdmin("")).toBe(false);
  });

  it("treats an unset env var as an empty allowlist", () => {
    delete process.env.PLATFORM_ADMIN_EMAILS;
    expect(isPlatformAdmin("chava@wiggy.app")).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- is-platform-admin`
Expected: FAIL — `Cannot find module './is-platform-admin'` (or similar resolution error), since the
implementation file doesn't exist yet.

- [ ] **Step 3: Write the implementation**

```typescript
/**
 * Platform admins operate above all tenants (create businesses, invite their
 * first admin) and are not modeled as a `memberships.role` at all — see
 * docs/superpowers/specs/2026-09-09-platform-admin-console-design.md.
 * v1 identity is a static allowlist; revisit with a DB-backed flag if this
 * ever needs self-service delegation to more than a handful of operators.
 */
export function isPlatformAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowlist = parseAllowlist(process.env.PLATFORM_ADMIN_EMAILS);
  return allowlist.has(email.trim().toLowerCase());
}

function parseAllowlist(raw: string | undefined): Set<string> {
  return new Set(
    (raw ?? "")
      .split(",")
      .map((entry) => entry.trim().toLowerCase())
      .filter((entry) => entry.length > 0),
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- is-platform-admin`
Expected: PASS — 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/platform-admin/is-platform-admin.ts src/lib/platform-admin/is-platform-admin.test.ts
git commit -m "feat(platform-admin): add allowlist-based isPlatformAdmin check"
```

---

### Task 2: `isValidSlug` — business slug format

**Files:**

- Create: `src/lib/platform-admin/slug.ts`
- Test: `src/lib/platform-admin/slug.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, expect, it } from "vitest";

import { isValidSlug } from "./slug";

describe("isValidSlug", () => {
  it("accepts a simple lowercase slug", () => {
    expect(isValidSlug("wiggy-dev")).toBe(true);
  });

  it("accepts digits and multiple hyphen-separated segments", () => {
    expect(isValidSlug("salon-2-north")).toBe(true);
  });

  it("accepts a single-word slug with no hyphen", () => {
    expect(isValidSlug("wiggy")).toBe(true);
  });

  it("rejects uppercase letters", () => {
    expect(isValidSlug("Wiggy-Dev")).toBe(false);
  });

  it("rejects spaces", () => {
    expect(isValidSlug("wiggy dev")).toBe(false);
  });

  it("rejects leading or trailing hyphens", () => {
    expect(isValidSlug("-wiggy")).toBe(false);
    expect(isValidSlug("wiggy-")).toBe(false);
  });

  it("rejects doubled hyphens", () => {
    expect(isValidSlug("wiggy--dev")).toBe(false);
  });

  it("rejects an empty string", () => {
    expect(isValidSlug("")).toBe(false);
  });

  it("rejects non-ASCII characters (e.g. Hebrew)", () => {
    expect(isValidSlug("סלון")).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- slug.test`
Expected: FAIL — `Cannot find module './slug'`.

- [ ] **Step 3: Write the implementation**

```typescript
/**
 * Business slugs are typed by hand in the platform-admin console (no
 * auto-slug-from-Hebrew-name — see the design spec) and must stay
 * URL/identifier-safe: lowercase letters and digits, single hyphens between
 * segments, no leading/trailing or doubled hyphens.
 */
const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function isValidSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- slug.test`
Expected: PASS — 9 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/platform-admin/slug.ts src/lib/platform-admin/slug.test.ts
git commit -m "feat(platform-admin): add business slug format validation"
```

---

### Task 3: Env var scaffolding

**Files:**

- Modify: `.env.example`

- [ ] **Step 1: Add the new var**

Open `.env.example` and append, after the `RESEND_API_KEY` block:

```
# Comma-separated list of emails allowed into the platform-admin console
# (/platform), which can create new businesses and invite their first admin.
# Server-only — never expose to the browser. Empty/unset means no one can
# access the console.
PLATFORM_ADMIN_EMAILS=
```

- [ ] **Step 2: Add your own email to your local `.env.local`**

`.env.local` is gitignored and not part of this plan's commits, but you need this set locally to
exercise Task 8's manual verification later:

```bash
echo 'PLATFORM_ADMIN_EMAILS=your-real-email@example.com' >> .env.local
```

- [ ] **Step 3: Commit**

```bash
git add .env.example
git commit -m "feat(platform-admin): document PLATFORM_ADMIN_EMAILS env var"
```

---

### Task 4: i18n strings

**Files:**

- Modify: `messages/he.json`

- [ ] **Step 1: Add the `platformAdmin` namespace**

Open `messages/he.json`. It's a single top-level JSON object with keys like `"app"`, `"auth"`,
`"pages"`, etc. Add a new top-level key `"platformAdmin"` (alongside those, not nested inside any of
them) with this value:

```json
{
  "signOut": "התנתקות",
  "list": {
    "title": "עסקים",
    "newTenant": "עסק חדש",
    "emptyTitle": "עדיין אין עסקים",
    "emptyDescription": "צרו את העסק הראשון כדי להתחיל.",
    "noSlug": "—",
    "columns": {
      "name": "שם",
      "slug": "מזהה",
      "timezone": "אזור זמן",
      "members": "משתמשים",
      "created": "נוצר בתאריך"
    }
  },
  "new": {
    "title": "יצירת עסק חדש",
    "subtitle": "יוצר עסק חדש ושולח למנהל שלו הזמנה בדוא\"ל",
    "nameLabel": "שם העסק",
    "slugLabel": "מזהה (slug)",
    "slugHelp": "אותיות לועזיות קטנות, ספרות ומקפים בלבד, לדוגמה: my-salon",
    "timezoneLabel": "אזור זמן",
    "adminNameLabel": "שם מלא של המנהל/ת",
    "adminEmailLabel": "אימייל של המנהל/ת",
    "submit": "יצירה ושליחת הזמנה",
    "errors": {
      "missingFields": "יש למלא את כל השדות.",
      "invalidSlug": "המזהה יכול להכיל רק אותיות לועזיות קטנות, ספרות ומקפים, ללא רווחים.",
      "slugTaken": "המזהה הזה כבר תפוס על ידי עסק אחר.",
      "invalidEmail": "כתובת האימייל אינה תקינה.",
      "invalidTimezone": "אזור הזמן אינו תקין.",
      "generic": "משהו השתבש. נסו שוב."
    }
  }
}
```

Double-check trailing commas: this key must be followed by a comma if it's not the last top-level
key, and the key before it must end with a comma too. Run `python3 -m json.tool messages/he.json >
/dev/null` afterward as a quick syntax check.

- [ ] **Step 2: Run the full test suite to confirm no duplicate-key or syntax break**

Run: `npm run test`
Expected: PASS — including `src/i18n/messages.test.ts`, which fails loudly if any key path in
`messages/he.json` is duplicated (see that file's own comment for why this matters: a duplicate key
silently shadows the other and next-intl renders the raw key path in the UI).

- [ ] **Step 3: Commit**

```bash
git add messages/he.json
git commit -m "feat(platform-admin): add i18n strings for the platform admin console"
```

---

### Task 5: `createTenantAction` — the provisioning server action

**Files:**

- Create: `src/lib/platform-admin/actions.ts`

This action is Supabase-Admin-API-dependent (creates real auth users, sends real invite emails) and
is not covered by the no-Supabase unit suite — same as `scripts/seed-dev.ts` has no automated test.
It's verified manually in Task 8. There is no failing-test step for this task; write it directly,
then verify with `npm run build` (type-checks) before committing.

- [ ] **Step 1: Write the action**

```typescript
"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isPlatformAdmin } from "./is-platform-admin";
import { isValidSlug } from "./slug";

const DEFAULT_TIMEZONE = "Asia/Jerusalem";

type TenantErrorCode =
  | "missingFields"
  | "invalidSlug"
  | "slugTaken"
  | "invalidEmail"
  | "invalidTimezone"
  | "generic";

class TenantActionError extends Error {
  constructor(public readonly code: TenantErrorCode) {
    super(code);
  }
}

function redirectPath(path: string, params: Record<string, string>) {
  const search = new URLSearchParams(params).toString();
  return search ? `${path}?${search}` : path;
}

async function getSiteOrigin(): Promise<string> {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit;

  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "localhost:3000";
  const proto = requestHeaders.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidTimeZone(timezone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

type AdminClient = ReturnType<typeof createAdminClient>;

/**
 * Finds the business by slug, or creates it. A slug that already belongs to
 * a business with the *same* name and timezone is treated as a retry of this
 * same submission (idempotent — see the design spec) and reused. A slug that
 * belongs to a business with different fields is a real collision with an
 * unrelated business.
 */
async function findOrCreateBusiness(
  admin: AdminClient,
  input: { name: string; slug: string; timezone: string },
): Promise<string> {
  const existing = await admin
    .from("businesses")
    .select("id, name, timezone")
    .eq("slug", input.slug)
    .maybeSingle();
  if (existing.error) throw new TenantActionError("generic");

  if (existing.data) {
    const sameSubmission =
      existing.data.name === input.name &&
      existing.data.timezone === input.timezone;
    if (!sameSubmission) throw new TenantActionError("slugTaken");
    return existing.data.id;
  }

  const inserted = await admin
    .from("businesses")
    .insert({ name: input.name, slug: input.slug, timezone: input.timezone })
    .select("id")
    .single();
  if (inserted.error) {
    if (inserted.error.code === "23505") {
      throw new TenantActionError("slugTaken");
    }
    throw new TenantActionError("generic");
  }
  return inserted.data.id;
}

/** The admin list API is paginated; scan until the email is found or the pages run out (same approach as `scripts/seed-dev.ts`). */
async function findUserIdByEmail(
  admin: AdminClient,
  email: string,
): Promise<string | undefined> {
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw new TenantActionError("generic");
    const match = data.users.find((u) => u.email === email);
    if (match) return match.id;
    if (data.users.length < 200) return undefined;
  }
}

/**
 * Finds or invites the admin user, then sets their display name (the
 * `handle_new_user` trigger only sets id/email — `scripts/seed-dev.ts` fills
 * this same gap manually). Returns the user id for the membership upsert.
 */
async function findOrInviteAdmin(
  admin: AdminClient,
  input: { email: string; fullName: string },
  redirectTo: string,
): Promise<string> {
  let userId = await findUserIdByEmail(admin, input.email);
  if (!userId) {
    const invited = await admin.auth.admin.inviteUserByEmail(input.email, {
      data: { full_name: input.fullName },
      redirectTo,
    });
    if (invited.error || !invited.data.user) {
      throw new TenantActionError("generic");
    }
    userId = invited.data.user.id;
  }

  const updated = await admin
    .from("profiles")
    .update({ full_name: input.fullName })
    .eq("id", userId);
  if (updated.error) throw new TenantActionError("generic");

  return userId;
}

export async function createTenantAction(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!isPlatformAdmin(authData.user?.email)) {
    redirect("/");
  }

  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const timezone =
    String(formData.get("timezone") ?? "").trim() || DEFAULT_TIMEZONE;
  const adminName = String(formData.get("adminName") ?? "").trim();
  const adminEmail = String(formData.get("adminEmail") ?? "").trim();

  const fieldParams = { name, slug, timezone, adminName, adminEmail };

  if (!name || !slug || !adminName || !adminEmail) {
    redirect(
      redirectPath("/platform/new", { ...fieldParams, error: "missingFields" }),
    );
  }
  if (!isValidSlug(slug)) {
    redirect(
      redirectPath("/platform/new", { ...fieldParams, error: "invalidSlug" }),
    );
  }
  if (!isValidEmail(adminEmail)) {
    redirect(
      redirectPath("/platform/new", { ...fieldParams, error: "invalidEmail" }),
    );
  }
  if (!isValidTimeZone(timezone)) {
    redirect(
      redirectPath("/platform/new", {
        ...fieldParams,
        error: "invalidTimezone",
      }),
    );
  }

  const admin = createAdminClient();
  const origin = await getSiteOrigin();

  try {
    const businessId = await findOrCreateBusiness(admin, {
      name,
      slug,
      timezone,
    });
    const userId = await findOrInviteAdmin(
      admin,
      { email: adminEmail, fullName: adminName },
      `${origin}/reset-password`,
    );

    const membership = await admin
      .from("memberships")
      .upsert(
        { user_id: userId, business_id: businessId, role: "admin" },
        { onConflict: "user_id,business_id" },
      );
    if (membership.error) throw new TenantActionError("generic");
  } catch (error) {
    const code = error instanceof TenantActionError ? error.code : "generic";
    redirect(redirectPath("/platform/new", { ...fieldParams, error: code }));
  }

  redirect(redirectPath("/platform", { created: slug }));
}
```

- [ ] **Step 2: Type-check**

Run: `npm run build`
Expected: build succeeds (this also type-checks the whole project — if `createAdminClient`'s
`Database` typing rejects any field name here, it fails here, not silently at runtime).

- [ ] **Step 3: Commit**

```bash
git add src/lib/platform-admin/actions.ts
git commit -m "feat(platform-admin): add createTenantAction (business + invite + membership)"
```

---

### Task 6: `listTenants` — cross-tenant listing query

**Files:**

- Create: `src/lib/platform-admin/queries.ts`

- [ ] **Step 1: Write the query module**

```typescript
import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type TenantSummary = {
  id: string;
  name: string;
  slug: string | null;
  timezone: string;
  createdAt: string;
  memberCount: number;
};

/**
 * Cross-tenant listing for the platform-admin console. `businesses` RLS
 * (`businesses_select_members`, `supabase/migrations/20260803120100_rls_policies.sql`)
 * only lets a *member* see their own business, and a platform admin is a
 * member of none — so this must go through the service-role client to see
 * anything at all. Never call this outside the allowlist-gated `/platform`
 * route group.
 */
export async function listTenants(): Promise<TenantSummary[]> {
  const admin = createAdminClient();

  const [businessesResult, membershipsResult] = await Promise.all([
    admin
      .from("businesses")
      .select("id, name, slug, timezone, created_at")
      .order("created_at", { ascending: false }),
    admin.from("memberships").select("business_id").eq("is_active", true),
  ]);
  if (businessesResult.error) throw businessesResult.error;
  if (membershipsResult.error) throw membershipsResult.error;

  const counts = new Map<string, number>();
  for (const membership of membershipsResult.data ?? []) {
    counts.set(
      membership.business_id,
      (counts.get(membership.business_id) ?? 0) + 1,
    );
  }

  return (businessesResult.data ?? []).map((business) => ({
    id: business.id,
    name: business.name,
    slug: business.slug,
    timezone: business.timezone,
    createdAt: business.created_at,
    memberCount: counts.get(business.id) ?? 0,
  }));
}
```

- [ ] **Step 2: Type-check**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/lib/platform-admin/queries.ts
git commit -m "feat(platform-admin): add listTenants cross-tenant query"
```

---

### Task 7: Fix the sign-in redirect loop for platform admins

**Files:**

- Modify: `src/lib/auth/actions.ts`

**Context:** `signInAction` currently does, at the end:

```typescript
const user = await getCurrentUserFromClient(supabase);
redirect(user ? landingPathForRole(user.role) : "/");
```

A signed-in user with no active business membership (which every platform-admin-only account has)
gets sent to `/`, which redirects to `/login` (no membership), which middleware bounces back to `/`
since they're signed in — an infinite loop. See the design spec's "A pre-existing trap" section.

- [ ] **Step 1: Add the import**

At the top of `src/lib/auth/actions.ts`, add:

```typescript
import { isPlatformAdmin } from "@/lib/platform-admin/is-platform-admin";
```

- [ ] **Step 2: Fix the redirect**

Find this block near the end of `signInAction`:

```typescript
const user = await getCurrentUserFromClient(supabase);
redirect(user ? landingPathForRole(user.role) : "/");
```

Replace it with:

```typescript
const user = await getCurrentUserFromClient(supabase);
if (user) {
  redirect(landingPathForRole(user.role));
}
if (isPlatformAdmin(email)) {
  redirect("/platform");
}
redirect("/");
```

(The final `redirect("/")` preserves today's behavior for a non-platform-admin account with no
membership — e.g. a fully deactivated user. That case still has the redirect-loop bug described
above; it's pre-existing and out of scope for this plan.)

- [ ] **Step 3: Run the full test suite**

Run: `npm run test`
Expected: PASS. (No existing test directly exercises `signInAction` — it's Supabase-dependent, same
category as Task 5 — so this step confirms nothing _else_ broke.)

- [ ] **Step 4: Commit**

```bash
git add src/lib/auth/actions.ts
git commit -m "fix(auth): send platform admins to /platform instead of looping through /login"
```

---

### Task 8: `/platform` route group — layout, list, and create pages

**Files:**

- Create: `src/app/(platform)/platform/layout.tsx`
- Create: `src/app/(platform)/platform/page.tsx`
- Create: `src/app/(platform)/platform/new/page.tsx`

- [ ] **Step 1: Write the layout**

```tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { Wordmark } from "@/components/layout/wordmark";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/lib/auth/actions";
import { isPlatformAdmin } from "@/lib/platform-admin/is-platform-admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * No `AppShell`/`SideNav` here — there is no salon context to render for a
 * platform admin, who by definition has no business membership. This is the
 * only gate: an allowlisted email, checked fresh on every request (see
 * design spec — never trust the route alone; `createTenantAction` re-checks
 * this too).
 */
export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.auth.getUser();
  if (!isPlatformAdmin(data.user?.email)) {
    redirect("/");
  }

  const appT = await getTranslations("app");
  const t = await getTranslations("platformAdmin");

  return (
    <div className="min-h-screen bg-bg">
      <header className="flex items-center justify-between border-b border-line bg-surface px-6 py-3">
        <Link href="/platform" className="flex items-center gap-2">
          <Wordmark text={appT("name")} size={22} />
        </Link>
        <form action={signOutAction}>
          <Button type="submit" variant="ghost">
            {t("signOut")}
          </Button>
        </form>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-8">{children}</main>
    </div>
  );
}
```

- [ ] **Step 2: Write the tenant list page**

```tsx
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listTenants } from "@/lib/platform-admin/queries";

export default async function PlatformTenantsPage() {
  const t = await getTranslations("platformAdmin.list");
  const tenants = await listTenants();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-section text-ink">{t("title")}</h1>
        <Button asChild>
          <Link href="/platform/new">{t("newTenant")}</Link>
        </Button>
      </div>

      {tenants.length === 0 ? (
        <EmptyState
          title={t("emptyTitle")}
          description={t("emptyDescription")}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("columns.name")}</TableHead>
              <TableHead>{t("columns.slug")}</TableHead>
              <TableHead>{t("columns.timezone")}</TableHead>
              <TableHead>{t("columns.members")}</TableHead>
              <TableHead>{t("columns.created")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants.map((tenant) => (
              <TableRow key={tenant.id}>
                <TableCell>{tenant.name}</TableCell>
                <TableCell>{tenant.slug ?? t("noSlug")}</TableCell>
                <TableCell>{tenant.timezone}</TableCell>
                <TableCell>{tenant.memberCount}</TableCell>
                <TableCell>
                  {new Date(tenant.createdAt).toLocaleDateString("he-IL")}
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

- [ ] **Step 3: Write the create-tenant page**

```tsx
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/ui/panel";
import { createTenantAction } from "@/lib/platform-admin/actions";

const DEFAULT_TIMEZONE = "Asia/Jerusalem";

type SearchParams = { [key: string]: string | string[] | undefined };

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function NewTenantPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const t = await getTranslations("platformAdmin.new");
  const error = firstParam(searchParams.error);

  const name = firstParam(searchParams.name) ?? "";
  const slug = firstParam(searchParams.slug) ?? "";
  const timezone = firstParam(searchParams.timezone) || DEFAULT_TIMEZONE;
  const adminName = firstParam(searchParams.adminName) ?? "";
  const adminEmail = firstParam(searchParams.adminEmail) ?? "";

  return (
    <Panel
      title={t("title")}
      subtitle={t("subtitle")}
      bodyClassName="space-y-4"
    >
      {error ? (
        <FormMessage variant="error">{t(`errors.${error}`)}</FormMessage>
      ) : null}

      <form action={createTenantAction} className="space-y-4">
        <FormField label={t("nameLabel")} htmlFor="name" required>
          <Input id="name" name="name" defaultValue={name} required />
        </FormField>
        <FormField
          label={t("slugLabel")}
          htmlFor="slug"
          description={t("slugHelp")}
          required
        >
          <Input id="slug" name="slug" defaultValue={slug} required />
        </FormField>
        <FormField label={t("timezoneLabel")} htmlFor="timezone" required>
          <Input
            id="timezone"
            name="timezone"
            defaultValue={timezone}
            required
          />
        </FormField>
        <FormField label={t("adminNameLabel")} htmlFor="adminName" required>
          <Input
            id="adminName"
            name="adminName"
            defaultValue={adminName}
            required
          />
        </FormField>
        <FormField label={t("adminEmailLabel")} htmlFor="adminEmail" required>
          <Input
            id="adminEmail"
            name="adminEmail"
            type="email"
            defaultValue={adminEmail}
            required
          />
        </FormField>
        <Button type="submit" className="w-full">
          {t("submit")}
        </Button>
      </form>
    </Panel>
  );
}
```

- [ ] **Step 4: Build and run the full test suite**

Run: `npm run build && npm run test`
Expected: both succeed. The build step is the real check here — it type-checks every new file and
would fail on a bad import path or prop mismatch against the actual `Button`/`FormField`/`Table`
component types.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(platform)"
git commit -m "feat(platform-admin): add /platform layout, tenant list, and create-tenant pages"
```

---

### Task 9: Update docs

**Files:**

- Modify: `docs/architecture.md`
- Modify: `AGENTS.md`

- [ ] **Step 1: Add a bullet to architecture.md §2**

Find this block (search for `## 2. Multi-tenancy & security`):

```markdown
- **Permissions** (which role may do what) live in **one app-layer code module** (the role set
  - permission map together). `memberships.role` is stored as **plain text validated against
    that set** (not a Postgres enum), so **adding a role = editing one file** — no migration.
    Enforced in server actions (the real check) and reflected in the UI.

---
```

Replace with (adding one bullet before the `---`):

```markdown
- **Permissions** (which role may do what) live in **one app-layer code module** (the role set
  - permission map together). `memberships.role` is stored as **plain text validated against
    that set** (not a Postgres enum), so **adding a role = editing one file** — no migration.
    Enforced in server actions (the real check) and reflected in the UI.
- **Platform admin (cross-tenant, exception to the above):** a small allowlist of operator emails
  (`PLATFORM_ADMIN_EMAILS`, `src/lib/platform-admin/is-platform-admin.ts`) may reach `/platform`
  to create a new business and invite its first admin. This is not a `memberships.role` — a
  platform admin has no business membership at all. Every operation there runs through the
  service-role client (bypasses RLS by design, same trust boundary as seeding). v1 scope is
  provisioning only; see `docs/superpowers/specs/2026-09-09-platform-admin-console-design.md`.

---
```

- [ ] **Step 2: Append to AGENTS.md's "Current repo state" narrative**

Open `AGENTS.md` and find the end of the long blockquote narrative (search for `Task types and
groups (#46–49) remain read-only and deferred.` — the last sentence of the block). Add a new
paragraph immediately after it, still inside the `>` blockquote:

```markdown
> A **platform admin console** then shipped (`docs/superpowers/specs/2026-09-09-platform-admin-console-design.md`)
> — `/platform`, gated by a static `PLATFORM_ADMIN_EMAILS` allowlist rather than any
> `memberships.role`, since a platform admin by definition belongs to no business. v1 is
> provisioning only: create a business, invite its admin (`createTenantAction`,
> `src/lib/platform-admin/`), find-or-create at every step so a failed submission can simply be
> resubmitted. Fixed a latent redirect loop in `signInAction` that any no-membership account
> (platform admin included) would have hit. Customer CSV import for an onboarded tenant stays a
> manual script for now, not part of the console.
```

- [ ] **Step 3: Commit**

```bash
git add docs/architecture.md AGENTS.md
git commit -m "docs: document the platform admin console"
```

---

### Task 10: End-to-end manual verification (local, then production)

This task has no code changes — it's the real proof this works, since none of the Supabase-Admin-API
code is unit-tested. Do this twice: once locally against local Supabase, once against
`wiggy-production` with a disposable scratch tenant (deleted afterward, so production stays clean
until the real salon is onboarded deliberately).

- [x] **Step 1: Local dry run** — done 2026-09-09.

```bash
colima start
npx supabase status   # confirm local Supabase is up; `npx supabase start` if not
npm run dev
```

Set `PLATFORM_ADMIN_EMAILS` in `.env.local` to an email you can receive mail for, or to
`admin@wiggy.local` (the dev seed's own admin — this lets you sign in with a password you already
know, `wiggy-dev-password`, to reach `/platform` without needing a real inbox).

**Caveat if your main checkout's `.env.local` already points at `wiggy-production`** (it did, on
this Mac — the local-Supabase values were present but commented out): build a genuinely local
`.env.local` from `npx supabase status`'s output before running `npm run dev`, or this "local" dry
run silently exercises production instead.

- [x] **Step 2: Walk through the flow locally** — done 2026-09-09, all 8 sub-steps passed.

1. Sign in at `/login` as your `PLATFORM_ADMIN_EMAILS` address.
2. Confirm you land on `/platform` (not stuck in a redirect loop, not on `/`).
3. Confirm `/platform` lists the existing `wiggy-dev` business.
4. Go to `/platform/new`, submit with an already-used slug (`wiggy-dev`) but a different business
   name — confirm you get the `slugTaken` error, not a silent overwrite.
5. Submit with a fresh slug (e.g. `scratch-test`), a real name, and an admin email you control.
6. Confirm redirect to `/platform` and the new business appears in the list.
7. Check the invite email arrived (local Supabase logs emails to the Inbucket UI printed by
   `supabase status`, usually `http://127.0.0.1:54324`) and that clicking it lands on
   `/reset-password` with a working "set password" form.

   **Known finding, not yet fixed:** on this Mac, the invite link's `redirect_to` silently dropped
   to the bare origin (`http://127.0.0.1:3000`) instead of `/reset-password`. Root cause: local
   Supabase's `supabase/config.toml` → `[auth] additional_redirect_urls` only allowlists exact
   URLs, and GoTrue falls back to bare `site_url` for anything not on that list, no path included.
   An attempted fix (adding a `/**` wildcard entry) did not propagate into the running GoTrue
   container on this CLI version and was reverted rather than leave a no-op config change in the
   repo. **This means an invited admin may land in the app directly (skipping the
   set-your-password screen) instead of on `/reset-password`.** Before Step 3 (and before the real
   salon is onboarded), check the same thing against the hosted dashboard — see the new pre-flight
   bullet there.

8. Resubmit the exact same `/platform/new` form (same name/slug/timezone/admin) a second time —
   confirm no error and no duplicate business/membership (idempotency check).

- [ ] **Step 3: Production dry run with a scratch tenant**

**Pre-flight, before anything else in this step:** in the Supabase Dashboard for `wiggy-production`
(project `mzbgpkiiruczufiaietn`) → Authentication → URL Configuration, confirm the redirect
allowlist includes `<production-domain>/reset-password` (or a wildcard covering it). Step 2's local
run found that an unlisted `redirectTo` path is silently dropped to the bare site URL rather than
rejected — there is no error to notice if this is misconfigured, only an invited admin who never
sees the password-setup screen. Confirm this **before** relying on the invite flow for the real
salon's admin.

Against `wiggy-production` (Supabase project `mzbgpkiiruczufiaietn`), with `PLATFORM_ADMIN_EMAILS`
set in the Vercel production environment to your real email, repeat steps 2.1–2.7 using a throwaway
slug such as `scratch-platform-admin-test` and an email you control.

- [ ] **Step 4: Clean up the scratch tenant from production**

Once verified, remove the scratch business so production stays clean for the real salon's onboarding.
Using the Supabase SQL editor or `execute_sql` against project `mzbgpkiiruczufiaietn`:

```sql
delete from public.memberships
where business_id = (select id from public.businesses where slug = 'scratch-platform-admin-test');

delete from public.businesses where slug = 'scratch-platform-admin-test';
```

The scratch auth user (if newly invited rather than reused) can stay or be deleted via the Supabase
Studio Auth page — it's harmless with no memberships, but delete it if you'd rather keep the user
list clean.

- [ ] **Step 5: Set the real Vercel env var for ongoing use**

Confirm `PLATFORM_ADMIN_EMAILS` is set in the Vercel production environment (Project Settings →
Environment Variables) with your real operating email(s), separate from whatever you used for the
scratch test if different.

---

## What's next (not part of this plan)

Once this ships and is verified, the actual first real salon gets onboarded by _using_ `/platform/new`
for real (no scratch cleanup this time), then running the customer-data-migration script described
in the design spec's Part B against the resulting `business_id`, sourced from
`context-files/import/customers_rows.csv`.
