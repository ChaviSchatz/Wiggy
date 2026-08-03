# WigFlow — Screen Inventory (build reference)

> The canonical list of screens/dialogs/templates we build from. Derived from
> `docs/architecture.md`, the domain docs, and ADRs. Reconciled to the reframed model
> (intake templates / task types / task groups — not the superseded workflow/operation templates).

**Legend:** **[v1]** = first shippable version · **[config]** = tenant-configuration editor (data
seeded in v1, editor UI later) · **[future]** = deferred module · **[parked]** = shelved for now.
"Screen" includes full pages, wizard steps, drawers, and substantial dialogs.

**v1 build surface ≈ 43 screens/dialogs.** v1 is *configurable-by-seed, not by UI* — stages, task
types/groups, intake templates, and staff are seeded via migrations for the first salon; the
[config] editors come before onboarding a second client.

## 1. Auth & account
1. Login **[v1]**
2. Forgot password (request reset) **[v1]**
3. Reset password (set new) **[v1]**
4. First-login bootstrap / accept invite **[v1]**
5. My profile / account settings (name, avatar, change password) **[v1]**
6. Tenant/business switcher (users in >1 salon) **[future]**

## 2. Home
7. Dashboard / home (counts by status, urgent, today's work, missing-item alerts) **[v1]**
8. Global search results **[future]**

## 3. Customers
9. Customers list (search + filter) **[v1]**
10. Create customer (form/dialog) **[v1]**
11. Edit customer (form/dialog) **[v1]**
12. Customer profile/detail (info + order history) **[v1]**
13. Customer timeline (CRM events) **[future]**
14. Merge duplicate customers **[future]**

## 4. Work orders — creation & detail
15. Work orders list (search, filter by status/urgency) **[v1]**
16. New order wizard — Step 1: select/create customer **[v1]**
17. New order wizard — Step 2: choose intake template (order kind) **[v1]**
18. New order wizard — Step 3: fill intake (dynamic fields + task/group selection) **[v1]**
19. New order wizard — Step 4: final details (dates, priority, notes) + confirm **[v1]**
20. Work-order hub — **full-page route** (identity, progress, next-action, tasks, notes, files, reference photos, audio, warnings, history, general details; back-to-board; `docs/ui/work-order-hub.md`) **[v1]**
20b. Work-order **quick-view peek** (drawer from board/queue: identity, progress, reference photos, quick actions) **[v1]**
21. Confirm/"start" order → generate tasks (dialog) **[v1]**
22. Cancel order (dialog) **[v1]**
23. Mark delivered/collected → completed (dialog) **[v1]**
24. Edit intake data after creation (screen/dialog, audited via `activity`) **[v1]**
25. Add manual / "Other" task (dialog) **[v1]**
26. Add attachment / upload file or photo (dialog) **[v1]**
27. Record/upload voice note (dialog) **[v1]**
28. Work order / intake form print view (print template) **[v1]**

## 5. Missing tops / skins (pulled into v1)
> Backed by a `missing_items` entity (see `docs/architecture.md` §4.4). Items are typically
> auto-created from an intake flag ("no top/skin") and also addable manually.
29. Missing items list (open items, filter by kind/status/responsible) **[v1]**
30. Missing item detail / handle status (open → found → ordered → handled) (dialog) **[v1]**
31. Create missing item manually (dialog) **[v1]**

## 6. Runtime tasks & production board
32. Production board (kanban by work stage; **task-centric** — one card per task, customer-led text, avatar = assignee, tap avatar to reassign; ADR 0010) **[v1]**
33. Task detail (drawer/dialog: status, assignee, due, notes) **[v1]**
34. Task comments (thread within task detail) **[v1]**
35. Change status / start / submit / complete (inline actions + confirm) **[v1]**
36. Approve / return-for-rework (dialog) **[v1]**
37. Reassign task / change responsible worker (dialog) **[v1]**
38. Defer task (reason + resume date) / resume (dialog) **[v1]**

## 7. Sprint & personal queue (ADR 0008/0009)
39. Sprint planning board — manager (lanes per employee, backlog, filters, assign, drag-reorder) **[v1]**
40. Create / close sprint (dialog) **[v1]**
41. Employee personal queue (current → next → queue → future/blocked → completed) **[v1]**
42. Awaiting-approval view (approver's separate managerial surface) **[v1]**
43. Bulk assign / reprioritize (dialog) **[v1]**

## 8. Configuration / admin (data seeded for v1; editors [config])
44. Settings hub / admin home **[config]**
45. Work stages — list + create/edit/reorder **[config]**
46. Task types catalog — list **[config]**
47. Task type create/edit (defaults: stage, duration, approval, staff, instructions) **[config]**
48. Task groups — list **[config]**
49. Task group create/edit + manage members **[config]**
50. Intake templates — list **[config]**
51. **Intake template builder** (ordered items: task type / task group / field / section; add/remove/reorder) **[config]**
52. Intake item config (per-item dialog: mandatory, visible, default-selected, selection mode, display style, help text, allow "Other", generates-tasks) **[config]**
53. Staff members — list + create/edit **[config]**
54. Users & roles — list, invite/create, assign role, link to staff **[config/admin]**
55. Branding settings (name, logo, colors) **[config/admin]**
56. Business/tenant settings (timezone, locale, sprint cadence) **[config/admin]**
57. Feedback management (admin view of submitted feedback) **[config]**

## 9. Cross-cutting / system
58. Submit feedback (global dialog) **[v1]**
59. Notifications center **[future]**
60. Activity / audit log viewer **[future]** (data written from day one)
61. Empty / loading / skeleton states (per screen) **[v1]**
62. Error pages — 403 / 404 / generic **[v1]**

## 10. Templates (non-screen render artifacts)
63. Intake form render template (drives wizard Step 3 from `intake_template_items`) **[v1]**
64. Work order / intake print (PDF) template **[v1]**
65. Auth emails (reset password, invite) **[v1]**
66. Board task-card & queue-item shared component templates **[v1]**

## 11. Future modules (`docs/roadmap.md`)
67. Client appointments — calendar, create/edit, appointment detail **[future]**
68. Billing — invoices list, invoice detail, create invoice **[future]**
69. Attendance — clock in/out, timesheets **[future]**
70. Planning engine — bottleneck/capacity/recommendations **[future]**
71. Production calendar (day view) **[parked]**
