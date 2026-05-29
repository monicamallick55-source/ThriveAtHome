-- Phase 40 — Life Story Archive
-- Creates the life_story_entries table for capturing and preserving member memories

CREATE TABLE life_story_entries (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at   timestamptz DEFAULT now() NOT NULL,
  member_id    uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  title        text NOT NULL,
  content      text NOT NULL,
  era          text,
  entry_type   text NOT NULL DEFAULT 'memory',
  created_by   uuid REFERENCES family_members(id) ON DELETE SET NULL,
  is_private   boolean NOT NULL DEFAULT false
);

ALTER TABLE life_story_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "family_all_own_life_story" ON life_story_entries FOR ALL
USING (EXISTS (
  SELECT 1 FROM family_members fm
  WHERE fm.member_id = life_story_entries.member_id
    AND fm.supabase_auth_id = auth.uid()
));

-- Admins and navigators can read life story entries for their assigned members
CREATE POLICY "admin_read_life_story" ON life_story_entries FOR SELECT
USING (EXISTS (
  SELECT 1 FROM family_members fm
  WHERE fm.supabase_auth_id = auth.uid()
    AND fm.role IN ('admin', 'navigator')
));
