-- Phase 39: Celebrations Engine
-- Creates celebration_events table for birthday detection and milestone tracking.

CREATE TABLE celebration_events (
  id                   uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at           timestamptz DEFAULT now() NOT NULL,
  member_id            uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  celebration_type     text NOT NULL,
  event_date           date NOT NULL,
  status               text NOT NULL DEFAULT 'scheduled',
  ai_message           text,
  family_notified_at   timestamptz,
  community_posted_at  timestamptz
);

ALTER TABLE celebration_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "family_all_own_celebrations" ON celebration_events FOR ALL
USING (EXISTS (
  SELECT 1 FROM family_members fm
  WHERE fm.member_id = celebration_events.member_id
  AND fm.supabase_auth_id = auth.uid()
));

CREATE POLICY "admin_all_celebrations" ON celebration_events FOR ALL
USING (EXISTS (
  SELECT 1 FROM family_members fm
  WHERE fm.supabase_auth_id = auth.uid()
  AND fm.role = 'admin'
));
