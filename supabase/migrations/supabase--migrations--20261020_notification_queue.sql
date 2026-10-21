-- Migration: notification_queue
-- Stores outbound SMS/email/push messages queued by the auto-scheduler
-- and other automation flows. A cron job or edge function drains the
-- queue and dispatches via Twilio / Resend / FCM.

create table if not exists notification_queue (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  scheduled_at timestamptz not null default now(),
  sent_at      timestamptz,
  failed_at    timestamptz,
  retry_count  int not null default 0,

  member_id    uuid references members(id) on delete cascade,
  channel      text not null check (channel in ('sms', 'email', 'push')),

  -- SMS fields
  phone        text,
  -- Email fields
  email        text,
  subject      text,
  -- Push fields
  device_token text,

  -- Common payload
  message      text not null,
  metadata     jsonb default '{}',

  status       text not null default 'pending'
               check (status in ('pending', 'sent', 'failed', 'cancelled'))
);

-- Index for the drain cron — pending messages ordered by scheduled_at
create index if not exists notification_queue_pending_idx
  on notification_queue (scheduled_at asc)
  where status = 'pending';

-- Index for member history
create index if not exists notification_queue_member_idx
  on notification_queue (member_id, created_at desc);

-- RLS: service role (server-side) bypasses RLS for all writes.
-- Authenticated users cannot read notification_queue from the client —
-- all access is via server-side admin client only.
alter table notification_queue enable row level security;

-- No client-side read policy — admin client uses service role key which bypasses RLS.
