-- G5.8 SMS queue + event ride link
create table if not exists outbound_sms (
  id uuid primary key default gen_random_uuid(),
  to_phone text not null,
  body text not null,
  member_id uuid references members(id),
  family_contact_id uuid,
  scheduled_at timestamptz not null default now(),
  sent_at timestamptz,
  status text not null default 'queued' check (status in ('queued','sent','failed','cancelled')),
  error_message text,
  twilio_sid text,
  created_at timestamptz default now()
);
create index if not exists idx_outbound_sms_scheduled on outbound_sms(scheduled_at) where status = 'queued';

-- Link service_bookings to events
alter table service_bookings add column if not exists event_id uuid references events(id);
alter table service_bookings add column if not exists linked_booking_id uuid references service_bookings(id);
