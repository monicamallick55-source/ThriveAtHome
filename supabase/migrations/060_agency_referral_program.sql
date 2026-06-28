-- Migration 060: Agency Referral Partner Program (Phase 78)
-- Creates agency_referral_links table, adds referring_agency_id to family_members

-- 1. Agency referral links table
CREATE TABLE IF NOT EXISTS agency_referral_links (
  id                      uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at              timestamptz DEFAULT now() NOT NULL,
  agency_id               uuid NOT NULL REFERENCES care_agencies(id) ON DELETE CASCADE,
  referral_code           text NOT NULL UNIQUE,
  referral_fee_cents      int NOT NULL DEFAULT 3500,
  total_referrals         int NOT NULL DEFAULT 0,
  total_fees_earned_cents int NOT NULL DEFAULT 0,
  is_active               boolean NOT NULL DEFAULT true
);
ALTER TABLE agency_referral_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_referral_links" ON agency_referral_links FOR ALL
  USING (EXISTS (SELECT 1 FROM family_members fm WHERE fm.supabase_auth_id = auth.uid() AND fm.role = 'admin'));
CREATE POLICY "agency_admin_own_links" ON agency_referral_links FOR ALL
  USING (EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.supabase_auth_id = auth.uid()
      AND fm.role = 'agency_admin'
      AND fm.agency_id = agency_referral_links.agency_id
  ));

-- 2. Track which agency referred each family member
ALTER TABLE family_members
  ADD COLUMN IF NOT EXISTS referring_agency_id uuid REFERENCES care_agencies(id);
