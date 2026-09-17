-- Tenant-level appointment-reminder configuration (design spec, "Customer
-- reminders"). whatsapp defaults false: no provider is wired up yet
-- (src/lib/appointments/notify.ts), so enabling it before one exists would
-- silently do nothing.
alter table public.business_settings
  add column send_appointment_confirmation boolean not null default true,
  add column send_appointment_reminder boolean not null default false,
  add column appointment_reminder_lead_hours integer not null default 24
    check (appointment_reminder_lead_hours > 0),
  add column appointment_reminder_email_enabled boolean not null default true,
  add column appointment_reminder_whatsapp_enabled boolean not null default false;
