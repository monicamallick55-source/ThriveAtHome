-- Migration 044: Org Membership Tiers (Phase 63 ISSUE fix)
-- Adds org_membership_tiers table for custom named fee tiers beyond the three preset ones.
-- Human must run in Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS org_membership_tiers (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at  timestamptz DEFAULT now() NOT NULL,
  org_id      uuid NOT NULL REFERENCES community_orgs(id) ON DELETE CASCADE,
  tier_name   text NOT NULL,
  amount_cents int NOT NULL DEFAULT 0,
  description text,
  is_active   boolean NOT NULL DEFAULT true,
  sort_order  int NOT NULL DEFAULT 0
);
ALTER TABLE org_membership_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_admin_own_tiers" ON org_membership_tiers FOR ALL
  USING (EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.supabase_auth_id = auth.uid()
    AND fm.org_id = org_membership_tiers.org_id
  ));
CREATE POLICY "admin_all_tiers" ON org_membership_tiers FOR ALL
  USING (EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.supabase_auth_id = auth.uid()
    AND fm.role = 'admin'
  ));
CREATE POLICY "authenticated_read_tiers" ON org_membership_tiers FOR SELECT
  TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_org_tiers_org ON org_membership_tiers(org_id);
