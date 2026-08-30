-- Stop asking the manager to pick a `work_order_kind`.
--
-- Follows 20260830140000, which snapshotted the template's name onto the
-- order and made it the display identity. That removed the last reader of
-- `work_order_kind`, leaving the picker in the template form asking a
-- non-technical salon manager to classify her template against a five-value
-- vocabulary that changes nothing.
--
-- The column stays -- it is NOT NULL with a check constraint on two tables,
-- and old rows carry real values -- but it gets a default so no application
-- code has to supply one. New templates are 'customer', which is what every
-- template the product ships already was.

alter table public.intake_templates
  alter column work_order_kind set default 'customer';

comment on column public.intake_templates.work_order_kind is
  'Vestigial. Nothing reads this; the template name is the order''s identity (see work_orders.template_name). Defaulted so the editor need not ask.';
