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
- **Feedback** box (bug/feature/question) captured per tenant for in-app feedback collection.

## Related
- ADR 0004. Architecture §4.5.
