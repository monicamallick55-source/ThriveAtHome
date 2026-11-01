-- Migration: notification_queue

create table if not exists notification_queue (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  scheduled_at timestamptz not null default now(),
  sent_at      timestamptz,
  failed_at    timestamptz,
  retry_count  int not null default 0,
  member_id    uuid references members(id) on delete cascade,
  channel      text not null check (channel in ('sms', 'email', 'push')),
  phone        text,
  email        text,
  subject      text,
  device_token text,
  message      text not null,
  metadata     jsonb default '{}',
  status       text not null default 'pending'
               check (status in ('pending', 'sent', 'failed', 'cancelled'))
);

create index if not exists notification_queue_pending_idx
  on notification_queue (scheduled_at asc) where status = 'pending';

create index if not exists notification_queue_member_idx
  on notification_queue (member_id, created_at desc);

alter table notification_queue enable row level security;
