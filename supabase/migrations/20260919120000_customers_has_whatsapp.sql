-- Customers: whether the client can be reached on WhatsApp. A plain per-client
-- flag set on the Customers screen and shown in the list. Default false: the
-- salon has to say so, so existing clients are "not known to have WhatsApp"
-- rather than being assumed to.
alter table public.customers
  add column has_whatsapp boolean not null default false;
