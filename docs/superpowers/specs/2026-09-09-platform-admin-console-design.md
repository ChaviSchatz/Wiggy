# Platform admin console — tenant provisioning (design)

> **Status:** approved design, not yet implemented.
> **Covers:** creating a new business (tenant) and inviting its first admin, from outside any
> tenant's own UI.
> **Part B (appendix)** documents the one-time customer data migration for the first real salon —
> not a UI feature, executed as a script once this console exists.

## Why now

The first real salon (not the `wiggy-dev` test tenant) is ready to move onto Wiggy and bring
existing customer data with them. Today the only way to create a business + admin is
`scripts/seed-dev.ts`, which is hardcoded to one dev business/dev credentials and requires shell
access to the service-role key — not something to run by hand against production for every new
customer, and not repeatable by anyone who isn't already comfortable in the codebase.

Wiggy's roles (`admin`/`manager`/`secretary`/`worker`, `src/lib/roles.ts`) are all scoped **inside**
a business membership. There is no existing concept of an operator who acts **above** all tenants.
This is the first slice of that concept, scoped to exactly what's needed to onboard a tenant:
create the business, invite its admin. Nothing else.

## Scope

**In:** a platform-admin-only area that can (1) list existing businesses and (2) create a new
business and invite its admin by email.

**Out (explicitly deferred):**

- CSV/bulk customer import through the UI — stays a script run per tenant for now (see Part B).
- Editing or deactivating a business from the console.
- Any dedicated audit log of platform-admin actions (Supabase's own logs cover this for now).
- Revoking a platform admin's access short of editing the allowlist env var and redeploying.
- Any self-serve signup — a human (you) always initiates tenant creation.

## Identity: who is a platform admin

A server-only env var, `PLATFORM_ADMIN_EMAILS` (comma-separated, case-insensitive match), read by a
new pure helper:

```
src/lib/platform-admin/is-platform-admin.ts
  isPlatformAdmin(email: string | null | undefined): boolean
```

No schema change, no new table. This is deliberately the cheapest thing that works for a small,
infrequently-changing set of operators; revisit with a real `is_platform_admin` flag (or dedicated
table) if/when this needs to support self-service delegation.

Checked in two places, never trusted from one alone:

1. The new route group's layout (keeps unauthorized users out of the pages).
2. Inside the server action itself (defense in depth — a server action is reachable independent of
   which page rendered the form that called it).

## A pre-existing trap this design must not fall into

`signInAction` (`src/lib/auth/actions.ts`) currently does, when a signed-in user has no active
business membership:

```
const user = await getCurrentUserFromClient(supabase);
redirect(user ? landingPathForRole(user.role) : "/");
```

`/` renders under `(app)/layout.tsx`, which calls `getCurrentUser()`, gets `null` (no membership),
and redirects to `/login`. Middleware then sees a signed-in user hit `/login` and bounces them back
to `/`. **Infinite redirect loop.** A platform-admin-only account (no salon membership at all) would
hit this today.

Fix, scoped narrowly to this path: when `user` is `null`, check `isPlatformAdmin(email)` before
falling back to `/`; platform admins go to `/platform` instead. This is the only change to existing
auth code — everything else is additive.

(Note for later: this same loop would also catch any _non_-platform-admin account with zero active
memberships, e.g. a fully deactivated user. That's a pre-existing bug, out of scope here — flagging
it so it isn't rediscovered as a surprise.)

## Routes and access

```
/platform                new — list of businesses
/platform/new             new — create business + invite admin
```

A new route group `src/app/(platform)/platform/`, parallel to `(app)` and `(auth)`. Its layout does
**not** reuse `AppShell`/`SideNav` — there is no salon context to render. It does its own check:

```
const { data } = await supabase.auth.getUser();
if (!isPlatformAdmin(data.user?.email)) redirect("/");
```

Minimal chrome: a small header (product name + "Platform admin") and a sign-out link. No
`AppShell`, no bottom nav, no i18n locale switching concerns beyond reusing existing message
catalog conventions for its own strings.

Middleware (`src/middleware.ts`) needs **no change** — its only gate today is session + completed
first-login bootstrap, both of which apply the same way to a platform admin as to anyone else (they
complete the same one-time "what's your name" step).

## Screens

**`/platform` — tenant list.** A simple table: business name, slug, timezone, created date, member
count. Read-only. Exists so you can see what's already there before creating another business,
and to confirm a slug isn't already taken before typing it into the form.

**`/platform/new` — create tenant.** One form, two logical halves:

- Business: name (required), slug (required, manual entry — no auto-slug-from-Hebrew-name; this is
  a rare, careful, human-typed action), timezone (defaults to `Asia/Jerusalem`, editable text for
  now — same as every other IANA-timezone field in this codebase, no picker component exists yet).
- Admin: full name (required), email (required).

One submit, one server action.

## `createTenantAction` — the actual provisioning

`src/lib/platform-admin/actions.ts`, `"use server"`. Three steps, each **find-or-create** —
deliberately not wrapped in a single all-or-nothing transaction, because step 2 calls the Supabase
Auth Admin API (a separate system from Postgres) and can't participate in a DB transaction anyway.
Idempotency is the substitute for atomicity: if any step fails, the whole action can simply be
resubmitted with the same inputs and it picks up where it left off, exactly like
`scripts/seed-dev.ts` already does for the dev seed.

1. **Business.** Look up by slug; if absent, insert (`name`, `slug`, `timezone`). A unique-slug
   conflict on insert (Postgres `23505`) is caught and surfaced as a friendly "that slug is already
   in use" error rather than a raw DB error.
2. **Admin user.** Look up an auth user by email (same pattern as `findUserIdByEmail` in
   `seed-dev.ts`). If absent, `supabase.auth.admin.inviteUserByEmail(email, { data: { full_name } })`
   with `redirectTo` pointed at the **existing** `/reset-password` screen — the invite email lands
   the new admin on the same "set your password" UI already built for password recovery, so this
   ships with zero new auth screens. Either way (found or invited), set `profiles.full_name` to the
   given name — mirrors `seed-dev.ts`'s own manual update, since the `handle_new_user` trigger only
   sets `id`/`email`. This also means the new admin skips the first-login bootstrap name screen,
   since the name is already on file.
3. **Membership.** Upsert into `memberships` (`user_id`, `business_id`, `role: "admin"`) on the
   `(user_id, business_id)` unique key.

All three steps run through `createAdminClient()` (service-role, bypasses RLS) — same trust
boundary as seeding and the integration tests, never exposed to the browser.

Inviting an email that already has a full account (not just an invited/pending one, e.g. someone
who's already an admin of another business) is a supported case, not an error: they simply gain a
second membership. No email is sent in that case since they already have credentials.

**Known interaction with an existing multi-tenancy gap:** `getCurrentUserFromClient`
(`src/lib/auth/current-user.ts`) picks a membership via `.limit(1)` with no `ORDER BY` when a user
has more than one active membership, landing them in an arbitrary business on every login (backend
audit finding #2, 2026-08-27, still open — no business switcher exists to correct it). This console
makes multi-membership easier to create (any second invite to an existing email), so it makes that
existing gap easier to hit too. Not a reason to block this console — just don't be surprised if an
admin invited to a second business reports landing in the "wrong" one after login.

On success: redirect to `/platform` showing the new business. On a validation or DB error: redirect
back to `/platform/new` with an error message, form values preserved via query params (matching the
`redirectPath` pattern already used in `src/lib/auth/actions.ts`).

## Data model / env changes

- No new tables, no new columns.
- New env var `PLATFORM_ADMIN_EMAILS` — server-only (no `NEXT_PUBLIC_` prefix), documented in
  `.env.example`, and must be set in the Vercel production environment (not just local `.env.local`)
  before this ships.

## Testing

Pure, unit-testable pieces, following the codebase's existing "pure logic, thin adapter" pattern
(`generate.ts`, `reorder.ts`):

- `isPlatformAdmin` — allowlist parsing, case-insensitive email match, empty/undefined input.
- Slug validation (format: `^[a-z0-9]+(-[a-z0-9]+)*$` — lowercase letters, digits, single hyphens
  between segments, no leading/trailing/double hyphens) — extracted as its own pure function so the
  action doesn't inline regex checks.

`createTenantAction` itself is Supabase-Admin-API-dependent and not covered by the no-Supabase unit
suite; manual verification against the real `wiggy-production` project stands in for it here, same
as the existing seed scripts have no automated test.

---

## Part B (appendix) — first salon's customer data migration

Not a UI feature. A one-off script (`scripts/migrate-customers-<slug>.ts` or run inline via the
Supabase admin client) executed once `/platform/new` has created this salon's tenant, targeting
that tenant's `business_id`. Source: `context-files/import/customers_rows.csv` (257 rows, old
system export).

**Column mapping.** `full_name → name`, `phone` (normalized to digits-only, e.g. `054-8592075` →
`0548592075`), `email → email`, `notes → notes`. Dropped: `customer_photo_url` and
`easybizy_client_id` (empty on every row — no data loss), the old system's own `id` and
`business_id` (not meaningful in Wiggy). `created_at`/`updated_at` are preserved from the export
rather than stamped at import time.

**Dedup, decided against the actual data (46 same-name groups found):**

| Group type                                                         | Count               | Handling                                                                                                                            |
| ------------------------------------------------------------------ | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Same name + same normalized phone                                  | 22 groups (33 rows) | Merge into one customer.                                                                                                            |
| Same name, no row in the group has any phone                       | 22 groups           | Merge into one customer. **Append a note** recommending staff collect a phone number next time they're in touch with this customer. |
| Same name, phones present but disagree (מירי גרליץ, מלכי יעקובסון) | 2 groups            | Keep as separate, distinct customers — conflicting phone is treated as evidence of two different people.                            |

Any other customer that ends up with no phone at all after migration (not just merged ones) also
gets the same recommend-a-phone-number note, so front-desk staff have a consistent signal to close
the gap during a customer's next visit rather than only on merged records.

This section is a record of the agreed migration rules, not a task tracked through
`writing-plans` — it's executed by hand once the tenant exists, with `execute_sql`/the admin client,
and verified by row count + a spot check in Supabase Studio.

---

## Part C (appendix) — production rollout requirements

Discovered by actually running this feature against `wiggy-production` after merge, not anticipated
in the original design or plan. None of this is a code change — it's environment/dashboard
configuration that has to exist before the console (or, for the SMTP piece, any auth email at all)
works in production. Recorded here so the next environment (or a rebuild of this one) doesn't have
to rediscover it by trial and error.

**1. `SUPABASE_SERVICE_ROLE_KEY` must be set in Vercel.** Before this feature, nothing in the
deployed app used the service-role client at runtime — it was only ever used by local seed scripts
against `.env.local`. `src/lib/platform-admin/{actions,queries}.ts` changed that: `/platform`
crashes with `Missing Supabase env vars` the moment anything calls `createAdminClient()` if this
isn't set in Vercel's Production environment (Project Settings → Environment Variables), separately
from `.env.local`. Set it, then redeploy — Vercel only applies new env vars to deployments created
_after_ they're added.

**2. `PLATFORM_ADMIN_EMAILS` — same deal.** Set in Vercel Production, and needs a fresh deployment
to take effect. Forgetting to redeploy after adding it looks like "the allowlist isn't working" when
it's actually just not live yet.

**3. Supabase Auth → URL Configuration needs the real domain, not the `localhost` default.**
A fresh Supabase project defaults **Site URL** to `http://127.0.0.1:3000` / `http://localhost:3000`.
Every `redirectTo` this app passes (invite emails → `/reset-password`, password-reset emails →
`/reset-password`) falls back **silently** to whatever Site URL is configured whenever the exact
requested URL isn't on the **Redirect URLs** allowlist — no error, the admin API call still returns
200, the link just lands the user somewhere unhelpful (was observed landing users on their own
`localhost:3000`, and later on bare `https://wiggy.app` instead of `/reset-password`). Fix, in the
Supabase Dashboard → Authentication → URL Configuration:

- **Site URL:** `https://wiggy.app` (the real production domain)
- **Redirect URLs:** must include a **wildcard**, e.g. `https://wiggy.app/**` — the bare origin
  alone (`https://wiggy.app`) matches only itself, not `/reset-password` or any other path.

**4. Custom SMTP is required — the built-in mailer cannot support real invites.** Supabase's
built-in email sending has two limits that make it unusable for this feature beyond a single test:
a strict per-project rate limit (observed failing with `429: email rate limit exceeded` after a
handful of emails in under an hour), and — more fundamentally — **a project with no custom SMTP
configured can only deliver to the project owner's own email address**, per Resend's own sandbox
restriction (`"You can only send testing emails to your own email address"`). Since the entire
point of the platform-admin console is inviting _other_ people, custom SMTP isn't optional. Set up
(Supabase Dashboard → Project Settings → Authentication → SMTP Settings):

| Field        | Value                                                    |
| ------------ | -------------------------------------------------------- |
| Sender email | `noreply@wiggy.app` (must be on a domain verified below) |
| Sender name  | `Wiggy`                                                  |
| Host         | `smtp.resend.com`                                        |
| Port         | `465`                                                    |
| Username     | `resend` (literal)                                       |
| Password     | a Resend API key                                         |

**Verifying the sending domain in Resend** (Domains → Add Domain → `wiggy.app`) requires three DNS
records — add them wherever the domain's DNS is actually managed (check with `dig NS <domain>`;
`wiggy.app` turned out to use Vercel's own nameservers, so its records live in Vercel → Domains →
`wiggy.app` → DNS Records, not at a registrar):

| Type | Name                | Value                                           | Priority |
| ---- | ------------------- | ----------------------------------------------- | -------- |
| TXT  | `resend._domainkey` | the DKIM public key Resend generates per-domain | —        |
| MX   | `send`              | `feedback-smtp.<region>.amazonses.com`          | 10       |
| TXT  | `send`              | `v=spf1 include:amazonses.com ~all`             | —        |

Until the domain shows **Verified** in Resend (not just "records added" — propagation plus Resend's
own async check takes a few minutes to an hour), sending to anyone other than the account owner
continues to fail with the sandbox restriction above even with SMTP otherwise configured correctly.
