-- Migration 072: Self-service community-org discovery + join requests (Batch 1, item 12)
-- A member (or their family) can search active community orgs and request to join.
-- The org admin approves or declines; approval creates an org_memberships row.
-- Run once in the Supabase SQL Editor. Safe to re-run.

CREATE TABLE IF NOT EXISTS org_join_requests (
  id                 uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at         timestamptz DEFAULT now() NOT NULL,
  member_id          uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  org_id             uuid NOT NULL REFERENCES community_orgs(id) ON DELETE CASCADE,
  requested_by_auth  uuid,                       -- supabase auth id of whoever submitted
  requester_name     text,
  message            text,
  status             text NOT NULL DEFAULT 'pending',  -- pending | approved | declined | cancelled
  decided_by_auth    uuid,
  decided_at         timestamptz,
  decision_note      text,
  UNIQUE (member_id, org_id)
);
ALTER TABLE org_join_requests ENABLE ROW LEVEL SECURITY;

-- The member's own family can see / create / cancel their request.
DO $$ BEGIN
  CREATE POLICY "family_own_join_requests" ON org_join_requests FOR ALL
    USING (EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.supabase_auth_id = auth.uid()
      AND fm.member_id = org_join_requests.member_id
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- The org admin for that org can see and decide requests.
DO $$ BEGIN
  CREATE POLICY "org_admin_join_requests" ON org_join_requests FOR ALL
    USING (EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.supabase_auth_id = auth.uid()
      AND fm.org_id = org_join_requests.org_id
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Platform admins see everything.
DO $$ BEGIN
  CREATE POLICY "admin_all_join_requests" ON org_join_requests FOR ALL
    USING (EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.supabase_auth_id = auth.uid()
      AND fm.role = 'admin'
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_org_join_requests_org_status ON org_join_requests(org_id, status);
CREATE INDEX IF NOT EXISTS idx_org_join_requests_member ON org_join_requests(member_id);
