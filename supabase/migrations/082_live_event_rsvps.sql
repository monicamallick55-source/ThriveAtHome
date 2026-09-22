-- FEATURE-003 — "I'm going" attendance on live-searched festival results
-- (Google Custom Search + Claude, see 081_event_search_cache.sql). These
-- events have no stable database id, so attendance is keyed on event_url.
CREATE TABLE IF NOT EXISTS live_event_rsvps (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at  timestamptz DEFAULT now() NOT NULL,
  member_id   uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  event_url   text NOT NULL,
  event_title text NOT NULL,
  event_date  text,
  UNIQUE(member_id, event_url)
);
ALTER TABLE live_event_rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone_can_read_live_event_rsvps" ON live_event_rsvps FOR SELECT USING (true);

CREATE POLICY "family_can_manage_own_live_event_rsvps" ON live_event_rsvps FOR ALL
  USING (EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.member_id = live_event_rsvps.member_id AND fm.supabase_auth_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.member_id = live_event_rsvps.member_id AND fm.supabase_auth_id = auth.uid()
  ));

CREATE POLICY "member_direct_can_manage_own_live_event_rsvps" ON live_event_rsvps FOR ALL
  USING (EXISTS (
    SELECT 1 FROM members m
    WHERE m.id = live_event_rsvps.member_id AND m.supabase_auth_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM members m
    WHERE m.id = live_event_rsvps.member_id AND m.supabase_auth_id = auth.uid()
  ));

CREATE INDEX IF NOT EXISTS idx_live_event_rsvps_url ON live_event_rsvps (event_url);
