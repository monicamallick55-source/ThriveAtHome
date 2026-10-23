-- Member-to-member messaging
-- Conversations are identified by a sorted pair of member IDs (conversation_key)

create table if not exists member_messages (
  id            uuid primary key default gen_random_uuid(),
  sender_id     uuid not null references members(id) on delete cascade,
  recipient_id  uuid not null references members(id) on delete cascade,
  -- Stable key for the conversation thread (always lesser UUID first)
  conversation_key text generated always as (
    case when sender_id::text < recipient_id::text
      then sender_id::text || '_' || recipient_id::text
      else recipient_id::text || '_' || sender_id::text
    end
  ) stored,
  body          text not null check (char_length(body) between 1 and 2000),
  read_at       timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists member_messages_conversation_key_idx
  on member_messages (conversation_key, created_at asc);

create index if not exists member_messages_recipient_unread_idx
  on member_messages (recipient_id, read_at)
  where read_at is null;

-- RLS: members can only read their own messages
alter table member_messages enable row level security;

-- Add geo coordinates to circle_events for radius search
-- circle_events is the community/circle events table (distinct from the platform-wide `events`)

alter table circle_events
  add column if not exists latitude  double precision,
  add column if not exists longitude double precision,
  add column if not exists zip_code  text;

-- Partial index on events that have coordinates (only those can be radius-searched)
create index if not exists circle_events_geo_idx
  on circle_events (latitude, longitude)
  where latitude is not null and longitude is not null;

-- Haversine distance in miles as a SQL function (reusable)
create or replace function haversine_miles(
  lat1 double precision, lon1 double precision,
  lat2 double precision, lon2 double precision
) returns double precision
language sql immutable parallel safe as $$
  select 3958.8 * acos(
    least(1.0, cos(radians(lat1)) * cos(radians(lat2))
      * cos(radians(lon2) - radians(lon1))
      + sin(radians(lat1)) * sin(radians(lat2))
    )
  )
$$;
