-- Migration 058: Grief Welcome Path (Phase 75)
-- Adds grief_welcome_path flag to members, referral_partners table for admin

ALTER TABLE members
  ADD COLUMN IF NOT EXISTS grief_welcome_path boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS grief_enrolled_at timestamptz;

-- Referral partner organizations (hospices, hospital social workers, bereavement counselors)
CREATE TABLE IF NOT EXISTS referral_partners (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at  timestamptz DEFAULT now() NOT NULL,
  org_name    text NOT NULL,
  contact     text,
  partner_type text NOT NULL DEFAULT 'hospice',
  -- hospice, hospital_social_worker, bereavement_counselor, other
  notes       text,
  is_active   boolean NOT NULL DEFAULT true
);
ALTER TABLE referral_partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_referral_partners" ON referral_partners FOR ALL
  USING (EXISTS (SELECT 1 FROM family_members fm WHERE fm.supabase_auth_id = auth.uid() AND fm.role = 'admin'));
