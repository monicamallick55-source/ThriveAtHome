-- Migration 077: FEATURE-008 — "My village isn't listed" flow.
-- A member who can't find their village/community org in search can either
-- (a) suggest it be added to ThriveAtHome, or (b) ask ThriveAtHome to invite the org.
-- Both actions log a row here for staff follow-up. Run once in the Supabase SQL Editor. Safe to re-run.

CREATE TABLE IF NOT EXISTS org_suggestions (
  id                 uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at         timestamptz DEFAULT now() NOT NULL,
  member_id          uuid REFERENCES members(id) ON DELETE CASCADE,
  submitted_by_auth  uuid,
  submitted_by_name  text,
  suggestion_type    text NOT NULL DEFAULT 'add_request',  -- add_request | invite_sent
  org_name           text NOT NULL,
  city               text,
  zip_code           text,
  contact_email      text,
  status             text NOT NULL DEFAULT 'pending',       -- pending | reviewed | added | dismissed
  notes              text
);
ALTER TABLE org_suggestions ENABLE ROW LEVEL SECURITY;

-- The member's own family can see / create their own suggestions.
DO $$ BEGIN
  CREATE POLICY "family_own_org_suggestions" ON org_suggestions FOR ALL
    USING (EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.supabase_auth_id = auth.uid()
      AND fm.member_id = org_suggestions.member_id
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- A direct-auth senior can see / create their own suggestions.
DO $$ BEGIN
  CREATE POLICY "member_direct_own_org_suggestions" ON org_suggestions FOR ALL
    USING (EXISTS (
      SELECT 1 FROM members m
      WHERE m.supabase_auth_id = auth.uid()
      AND m.id = org_suggestions.member_id
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Platform admins see and manage everything.
DO $$ BEGIN
  CREATE POLICY "admin_all_org_suggestions" ON org_suggestions FOR ALL
    USING (EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.supabase_auth_id = auth.uid()
      AND fm.role = 'admin'
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_org_suggestions_status ON org_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_org_suggestions_member ON org_suggestions(member_id);
