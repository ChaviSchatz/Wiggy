# Domain: Customers

**Purpose:** Customer records, and the anchor for the future CRM timeline.

## Entities
- **`customers`** — `business_id, name, phone, email, notes`, plus timestamps. Fields are
  intentionally simple for now.

## Notes
- A work order's `customer_id` is **nullable** — internal production, display wigs, and
  missing-item processes have no customer (see work-orders-and-runtime domain / ADR 0003).
- The future **customer timeline** is rendered from the unified `activity` stream filtered by
  `customer_id` (ADR 0004) — not a separate table.
- Full CRM (tags, follow-ups, communication log, merge duplicates) is future scope.

## Related
- ADR 0004. Architecture §4.5, §10.
