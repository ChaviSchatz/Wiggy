-- Snapshot the intake template's name onto the work order, replacing
-- `work_order_kind` as the order's display identity.
--
-- Why: `work_order_kind` was a fixed five-value vocabulary rendered through
-- `t("kind.<value>")`, and it had *no behavioural role anywhere* -- nothing
-- filtered on it, branched on it, or changed the wizard because of it. Its
-- only job was to label an order that has no customer ("הזמנה פנימית"), and
-- the template's own name does that better and is already tenant-owned:
-- "תיקון פאה" says more than "תיקון". Asking the manager to also pick a kind
-- was asking them to maintain a second naming system with no effect.
--
-- Snapshotted rather than joined, exactly like `work_order_kind` was:
-- runtime data must not change when the catalog is edited later
-- (architecture §5.1). Renaming a template leaves existing orders reading
-- as they did the day they were created.
--
-- `work_order_kind` itself is deliberately left in place for now: it is
-- NOT NULL with a check constraint, still carries meaning for orders created
-- before this migration, and dropping a column is the kind of change that
-- wants its own deliberate step once nothing has referenced it for a while.

alter table public.work_orders
  add column template_name text;

comment on column public.work_orders.template_name is
  'Snapshot of intake_templates.name at generation time (architecture §5.1). The order''s display identity when it has no customer.';

-- Backfill from the template each existing order was created from. Templates
-- cannot be deleted (`on delete restrict`), so every row resolves.
update public.work_orders as w
set template_name = t.name
from public.intake_templates as t
where t.id = w.intake_template_id
  and w.template_name is null;
