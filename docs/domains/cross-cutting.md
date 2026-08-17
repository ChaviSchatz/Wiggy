# Domain: Cross-cutting (Attachments, Activity/Audit, Platform)

## Attachments & Media
- **`attachments`** — one polymorphic table for all files: `kind (file|photo|voice), parent_type
  (work_order|runtime_task|customer), parent_id, storage_path`. Backed by Supabase Storage.
- Replaces the original two overlapping tables (`attachments` + `work_order_attachments`).

## Activity & Audit (unified stream)
- **`activity`** — append-only: `actor_user_id?, verb, subject_type, subject_id, work_order_id?,
  customer_id?, payload(JSON), created_at`.
- One stream powers **audit log**, **work-order history**, and the **future customer timeline**
  (filter by subject/order/customer). Never edited or deleted. (ADR 0004.)
- Every task/order state transition writes an activity entry.

## Platform
- Tenant **settings/branding** live on `businesses` (name, logo, color, timezone, locale).
- **`feedback_items`** — the in-app feedback box: `submitted_by?, kind (bug|feature|question),
  message, page_path?`. Reachable from the app shell (top bar on desktop, bottom bar on tablet) by
  **every role** — the one action with no role gate. `page_path` records where the submitter was,
  as free triage context.
  - **Append-only.** v1 ships no triage/management UI (screen inventory #57 is `[config]`), so the
    table carries no status or assignee column that nothing would ever update, and RLS grants only
    `select`/`insert` to members.

## Dashboard
- The landing page is **role-tailored**, not one shared screen: office roles
  (manager/admin/secretary) get order/sprint KPIs plus attention widgets (missing items,
  approvals awaiting them, orders due soon), workers get their own queue snapshot. Every widget
  reads existing tables — the dashboard owns no data of its own.
- A missing item counts as an alert until it is handled **or its order closes** (architecture §4.4).

## Related
- ADR 0004, ADR 0011. Architecture §4.5.
