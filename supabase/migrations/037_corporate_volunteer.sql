-- Phase 50l: Corporate Employee Volunteer Program
-- corporate_volunteer_programs: tracks employer-sponsored volunteer hour matching programs
-- corporate_volunteer_hours: attributes volunteer_visits to a corporate program for CSV export

CREATE TABLE corporate_volunteer_programs (
  id                           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at                   timestamptz DEFAULT now() NOT NULL,
  employer_account_id          uuid NOT NULL REFERENCES employer_accounts(id) ON DELETE CASCADE,
  program_name                 text NOT NULL,
  matching_rate_per_hour       numeric NOT NULL DEFAULT 15.00,
  annual_hour_cap_per_employee int DEFAULT 40,
  total_hours_logged           numeric NOT NULL DEFAULT 0,
  total_matched_value          numeric NOT NULL DEFAULT 0,
  integration_type             text NOT NULL DEFAULT 'manual_export',
  -- benevity, yourcause, brightfunds, manual_export, none
  package_type                 text NOT NULL DEFAULT 'standalone',
  -- standalone, bundled_with_subscription
  tier                         text NOT NULL DEFAULT 'community_partner',
  -- community_partner ($5K-15K/yr, 50-200hrs), champion ($15K-35K/yr, 200-500hrs),
  -- leader ($35K-50K+/yr, 500+hrs, co-branded recognition)
  status                       text NOT NULL DEFAULT 'active'
);
ALTER TABLE corporate_volunteer_programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_corporate_programs" ON corporate_volunteer_programs
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM family_members fm WHERE fm.supabase_auth_id = auth.uid() AND fm.role IN ('admin', 'navigator'))
  );

CREATE POLICY "employer_admin_read_own_programs" ON corporate_volunteer_programs
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.supabase_auth_id = auth.uid()
      AND fm.role = 'employer_admin'
      AND fm.employer_account_id = corporate_volunteer_programs.employer_account_id
    )
  );

-- Authenticated users can list active programs (volunteer application dropdown)
CREATE POLICY "authenticated_read_active_programs" ON corporate_volunteer_programs
  FOR SELECT TO authenticated USING (status = 'active');

CREATE TABLE corporate_volunteer_hours (
  id                   uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at           timestamptz DEFAULT now() NOT NULL,
  corporate_program_id uuid NOT NULL REFERENCES corporate_volunteer_programs(id) ON DELETE CASCADE,
  volunteer_id         uuid NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,
  visit_id             uuid REFERENCES volunteer_visits(id),
  hours_logged         numeric NOT NULL,
  logged_date          date NOT NULL,
  verified             boolean NOT NULL DEFAULT false,
  verified_by          uuid REFERENCES care_navigators(id),
  export_status        text NOT NULL DEFAULT 'pending'
  -- pending, exported, matched
);
ALTER TABLE corporate_volunteer_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_corporate_hours" ON corporate_volunteer_hours
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM family_members fm WHERE fm.supabase_auth_id = auth.uid() AND fm.role IN ('admin', 'navigator'))
  );

CREATE POLICY "employer_admin_read_own_hours" ON corporate_volunteer_hours
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1
      FROM family_members fm
      JOIN corporate_volunteer_programs cvp ON cvp.employer_account_id = fm.employer_account_id
      WHERE fm.supabase_auth_id = auth.uid()
      AND fm.role = 'employer_admin'
      AND cvp.id = corporate_volunteer_hours.corporate_program_id
    )
  );

-- Volunteers can see their own hours
CREATE POLICY "volunteer_read_own_hours" ON corporate_volunteer_hours
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM volunteers v
      WHERE v.supabase_auth_id = auth.uid()
      AND v.id = corporate_volunteer_hours.volunteer_id
    )
  );

-- Add corporate_program_id to volunteers table
ALTER TABLE volunteers
  ADD COLUMN IF NOT EXISTS corporate_program_id uuid REFERENCES corporate_volunteer_programs(id);

-- Seed: Acme Corp gets a test corporate volunteer program (if Acme Corp employer account exists from migration 036)
INSERT INTO corporate_volunteer_programs (employer_account_id, program_name, matching_rate_per_hour, annual_hour_cap_per_employee, tier, status)
SELECT id, 'Acme Corps Gives Back', 15.00, 40, 'community_partner', 'active'
FROM employer_accounts WHERE company_name = 'Acme Corp' LIMIT 1
ON CONFLICT DO NOTHING;
