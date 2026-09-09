# 0013 — People are one list, and a login is something a person may have

**Status:** Accepted

## Context

WigFlow modelled the humans in a salon twice.

`staff_members` is the **roster**: a name, a job title, a default work stage. It is what
`runtime_tasks.assigned_staff_member_id` points at, so it is the thing that can hold work. It has no
login.

`memberships` is the **login**: a `user_id`, a `business_id` and a role, and it is what RLS and the
permission map read. It has no job title and cannot hold a task.

`staff_members.user_id` was always the intended bridge between them, but nothing in the product
could ever set it — the column was display-only, and screen inventory #54 ("Users & roles") was
never built. The practical consequence: once the platform-admin console created a salon and its one
admin, that salon had **no way to give anyone else a login**. Every additional worker, secretary or
manager had to be created by hand against the Supabase service-role API.

The obvious fix is to build #54 as a second settings tab beside #53. That is what raises the product
question: does a salon owner think in "staff members" and "user accounts", or in people?

## Decision

**One People screen. `staff_members` is the spine, and a login is an optional thing hanging off a
person.**

- **Screens #53 and #54 merge.** Settings → Staff becomes Settings → People. There is no separate
  Users tab.
- **A person is a `staff_members` row.** `memberships` attaches to it via `staff_members.user_id`.
  Granting, correcting or revoking a login never creates or destroys the person.
- **A person is in exactly one of three states** — roster-only (no `user_id`), invited (`user_id`
  set, never signed in), or active (`user_id` set, has signed in). The state is **derived, never
  stored**.
- **Invite state is a badge, never a gate.** All three states are equally assignable, editable and
  manageable. An invited person who has not clicked the email can be given tasks today.
- **`user_id` is linked at invite time, not at acceptance.** `inviteUserByEmail` creates the auth
  user immediately and the `handle_new_user` trigger creates the profile with it, so the link is
  writable straight away.
- **Assignability is its own explicit flag.** `staff_members.is_assignable` decides who appears in
  assignee pickers. It is never derived from role or from invite state.
- **Deactivation is one switch.** "Deactivate" means the person left the salon: off the roster _and_
  no login. Separate roster/access switches are not exposed.

## Why

- **A salon owner thinks in people.** Two tabs would let them create Sarah twice — once as staff,
  once as a user — with nothing connecting the two and no signal they had done it. One screen makes
  that structurally impossible rather than merely discouraged.
- **Work is assigned to a person, not to an account.** `runtime_tasks.assigned_staff_member_id`
  already references `staff_members(id)`. Making the roster the spine keeps assignment independent of
  whether anyone ever logs in — which is how a salon actually works: the new colourist starts on
  Sunday whether or not IT has sorted her email out.
- **Linking early is what makes that pay off.** `fetchStaffMemberIdForUser` resolves My Work by
  `user_id`. Because the link is written when the invite is sent, the tasks assigned to someone
  before they accept are **waiting in their queue the first time they sign in** — no reconciliation
  step, no orphaned assignments, no "please reassign everything now that she's set up".
- **Assignability cannot be inferred.** The owner and the secretary are active people with logins who
  must never appear in an assignee picker; an invited bench worker must. Neither role nor invite
  state separates those cases, so the flag is explicit.

## Alternatives considered

- **Two tabs with an optional link** (roster and users kept separate, the invite form offering a
  dropdown of unlinked staff). Faithful to the existing schema and the smallest change, but it keeps
  the duplicate-person trap and asks the salon owner to understand a distinction that exists for the
  database's benefit, not theirs.
- **Union view — people are `staff_members` _plus_ memberships that have no roster row.** Avoids a
  backfill and keeps the owner out of assignee pickers for free, but it means a person has two
  possible identities depending on how they were created, and the duplicate problem returns.
- **Derive assignability from `default_work_stage_id`** instead of adding a column. Silently couples
  two unrelated fields: clearing someone's stage would quietly remove them from every picker with no
  visible cause.

## Consequences

- **A migration backfills a roster row for every membership without one** (today, each tenant's
  original admin), with `is_assignable = false`.
- **Two picker queries gained a filter** — `fetchAssignableStaff` and the Work-Order Hub's staff
  list. The three `staff_members` reads that resolve names by id deliberately did **not**, or
  historical task attribution would render blank.
- **A tenant-facing page now uses the service-role client.** The People page reads
  `last_sign_in_at` from Supabase Auth to derive the Invited badge; previously only the
  platform-admin area touched service-role. The lookup degrades to `null` on failure so a badge can
  never take the page down.
- **`manageUsers` finally has a consumer.** It was defined in `src/lib/roles.ts` with zero usages,
  reserved for exactly this. A manager keeps `manageStaff` and sees the whole list, but every
  access control is admin-only and re-checked server-side.
- **The multi-membership bug gets easier to hit.** Inviting someone who already belongs to another
  salon is supported, but `getCurrentUserFromClient` picks a membership with `.limit(1)` and no
  `order by`. That is a pre-existing open finding, not introduced here, and it should be fixed before
  People ships to a salon that shares staff with another tenant.
