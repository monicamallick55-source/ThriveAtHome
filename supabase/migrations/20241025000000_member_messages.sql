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

create policy "members read own messages"
  on member_messages for select
  using (
    sender_id    = (select id from members where supabase_auth_id = auth.uid()) or
    recipient_id = (select id from members where supabase_auth_id = auth.uid())
  );

create policy "members insert own messages"
  on member_messages for insert
  with check (
    sender_id = (select id from members where supabase_auth_id = auth.uid())
  );

create policy "members update own read_at"
  on member_messages for update
  using (recipient_id = (select id from members where supabase_auth_id = auth.uid()))
  with check (recipient_id = (select id from members where supabase_auth_id = auth.uid()));
