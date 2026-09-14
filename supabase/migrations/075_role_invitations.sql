-- Migration 075: Invitation-based role assignment (Batch 4)
-- One generic invitation table for every staff / partner role. An authorised
-- inviter (admin, navigator, org_admin, …) creates a row; the invitee opens
-- /invite/<token>, sets a password, and a family_members row is created with the
-- right role and org / agency / centre link already attached.
-- Run once in the Supabase SQL Editor. Safe to re-run (guards throughout).

CREATE TABLE IF NOT EXISTS role_invitations (
  id                   uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at           timestamptz DEFAULT now() NOT NULL,
  email                text NOT NULL,
  role                 text NOT NULL,               -- target user_role
  invited_by_auth      uuid,                         -- supabase auth id of the inviter
  invited_by_name      text,
  -- Optional scope links copied onto the new family_members row on accept:
  org_id               uuid,
  agency_id            uuid,
  employer_account_id  uuid,
  senior_center_id     uuid,
  aaa_id               uuid,
  network_id           uuid,
  university_name      text,
  token                text NOT NULL UNIQUE,
  status               text NOT NULL DEFAULT 'pending',  -- pending | accepted | expired | revoked
  note                 text,
  expires_at           timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  accepted_at          timestamptz,
  accepted_by_auth     uuid
);
ALTER TABLE role_invitations ENABLE ROW LEVEL SECURITY;

-- Platform admins see and manage every invitation.
DO $$ BEGIN
  CREATE POLICY "admin_all_role_invitations" ON role_invitations FOR ALL
    USING (EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.supabase_auth_id = auth.uid() AND fm.role = 'admin'
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Inviters can see the invitations they personally sent.
DO $$ BEGIN
  CREATE POLICY "inviter_own_role_invitations" ON role_invitations FOR SELECT
    USING (invited_by_auth = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Org admins see invitations scoped to their org.
DO $$ BEGIN
  CREATE POLICY "org_admin_scoped_role_invitations" ON role_invitations FOR SELECT
    USING (EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.supabase_auth_id = auth.uid()
      AND fm.org_id IS NOT NULL
      AND fm.org_id = role_invitations.org_id
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_role_invitations_token  ON role_invitations(token);
CREATE INDEX IF NOT EXISTS idx_role_invitations_status ON role_invitations(status, created_at);
CREATE INDEX IF NOT EXISTS idx_role_invitations_email  ON role_invitations(lower(email));
