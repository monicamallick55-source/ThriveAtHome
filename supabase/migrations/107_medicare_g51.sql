-- Migration 107: G5.1 Medicare features
-- 1. HICAP community partner seed
-- 2. medicare_open_enrollment important dates for 65+ members
-- 3. navigator_tasks service_subtype support

-- 1. HICAP community partner (inactive until human confirms referral process)
INSERT INTO community_partners (
  name, slug, category, description,
  phone, website, status, service_area,
  notes
)
VALUES (
  'HICAP of San Mateo County',
  'hicap-san-mateo',
  'medicare_counseling',
  'Free, unbiased Medicare counselling for beneficiaries and their families. Trained volunteer counsellors help compare plans, understand benefits, and identify cost-saving programs. Overseen by the California Department of Aging.',
  NULL,   -- human must confirm phone before activation
  'https://www.aging.ca.gov/Programs_and_Initiatives/HICAP/',
  'inactive',  -- human exit gate: confirm phone + referral process before setting active
  'San Mateo County, CA',
  'HICAP = Health Insurance Counseling and Advocacy Program. Confirm direct referral phone and process with county coordinator before activating.'
)
ON CONFLICT (slug) DO NOTHING;

-- 2. Add service_subtype column to navigator_tasks if missing
ALTER TABLE navigator_tasks
  ADD COLUMN IF NOT EXISTS service_subtype text;

-- 3. Medicare open enrollment important dates for members 65+
-- Seeds a recurring item_type for yearly Oct 15 – Dec 7 open enrollment window
-- Aria mentions once in early October; Grace can place reminder call
DO $$
DECLARE
  current_year int := EXTRACT(YEAR FROM now())::int;
  m RECORD;
BEGIN
  FOR m IN
    SELECT id FROM members
    WHERE date_of_birth IS NOT NULL
      AND EXTRACT(YEAR FROM AGE(date_of_birth)) >= 65
      AND active = true
  LOOP
    INSERT INTO important_dates (
      member_id,
      title,
      description,
      date_value,
      item_type,
      recurring_yearly,
      source
    )
    VALUES (
      m.id,
      'Medicare Open Enrollment',
      'Medicare Open Enrollment runs Oct 15 – Dec 7. You can review and change your Medicare plan during this window. A trained HICAP counsellor can compare plans with you for free.',
      (current_year || '-10-15')::date,
      'medicare_open_enrollment',
      true,
      'system'
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- 4. audit_log table (if not exists — some deploys may already have it)
CREATE TABLE IF NOT EXISTS audit_log (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at  timestamptz DEFAULT now() NOT NULL,
  actor_id    uuid,
  actor_role  text,
  action      text NOT NULL,
  metadata    jsonb DEFAULT '{}'
);
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff_read_audit_log" ON audit_log;
CREATE POLICY "staff_read_audit_log" ON audit_log FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM family_members
    WHERE supabase_auth_id = auth.uid()
      AND role IN ('admin','navigator')
  ));
