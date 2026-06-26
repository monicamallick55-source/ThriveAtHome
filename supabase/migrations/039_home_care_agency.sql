-- Migration 039: Home Care Agency Portal (Phase 59 — M19)
-- Creates: care_agencies, care_workers, care_visits, agency_referrals tables
-- Adds: agency_admin to user_role enum; agency_id to family_members

-- 1. Add agency_admin to user_role enum (care_worker is tracked via care_workers.supabase_auth_id)
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'agency_admin';

-- 2. Agency types and visit types
CREATE TYPE agency_type AS ENUM (
  'home_health', 'companion', 'skilled_nursing', 'staffing', 'hospice', 'other'
);
CREATE TYPE care_worker_role AS ENUM (
  'caregiver', 'nurse', 'therapist', 'care_coordinator', 'social_worker', 'other'
);
CREATE TYPE agency_visit_type AS ENUM (
  'personal_care', 'companionship', 'skilled_nursing', 'therapy',
  'medication_management', 'homemaking', 'transportation', 'other'
);
CREATE TYPE agency_visit_status AS ENUM (
  'scheduled', 'in_progress', 'completed', 'cancelled', 'missed'
);
CREATE TYPE referral_status AS ENUM (
  'pending', 'accepted', 'declined', 'completed'
);

-- 3. care_agencies table
CREATE TABLE care_agencies (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at       timestamptz DEFAULT now() NOT NULL,
  name             text NOT NULL,
  agency_type      agency_type NOT NULL DEFAULT 'companion',
  contact_name     text NOT NULL,
  contact_email    text NOT NULL,
  contact_phone    text,
  address          text,
  city             text,
  state            text,
  zip              text,
  license_number   text,
  clearcare_id     text,
  alayacare_id     text,
  wellsky_id       text,
  status           text NOT NULL DEFAULT 'active',
  notes            text
);
ALTER TABLE care_agencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_agencies" ON care_agencies FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.supabase_auth_id = auth.uid() AND fm.role = 'admin'
  ));
CREATE POLICY "agency_admin_read_own" ON care_agencies FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.supabase_auth_id = auth.uid()
      AND fm.role = 'agency_admin'
      AND fm.agency_id = care_agencies.id
  ));
CREATE POLICY "navigator_read_agencies" ON care_agencies FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM care_navigators cn WHERE cn.supabase_auth_id = auth.uid()
  ));

-- 4. Add agency_id to family_members (FK added after table exists)
ALTER TABLE family_members ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES care_agencies(id);

-- 5. care_workers table
CREATE TABLE care_workers (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at       timestamptz DEFAULT now() NOT NULL,
  supabase_auth_id uuid UNIQUE,
  agency_id        uuid NOT NULL REFERENCES care_agencies(id) ON DELETE CASCADE,
  full_name        text NOT NULL,
  email            text NOT NULL,
  phone            text,
  worker_role      care_worker_role NOT NULL DEFAULT 'caregiver',
  certifications   text[] DEFAULT '{}',
  is_active        boolean NOT NULL DEFAULT true,
  notes            text
);
ALTER TABLE care_workers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_care_workers" ON care_workers FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.supabase_auth_id = auth.uid() AND fm.role = 'admin'
  ));
CREATE POLICY "agency_admin_own_workers" ON care_workers FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.supabase_auth_id = auth.uid()
      AND fm.role = 'agency_admin'
      AND fm.agency_id = care_workers.agency_id
  ));
CREATE POLICY "care_worker_self" ON care_workers FOR SELECT TO authenticated
  USING (supabase_auth_id = auth.uid());
CREATE POLICY "navigator_read_workers" ON care_workers FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM care_navigators cn WHERE cn.supabase_auth_id = auth.uid()
  ));

-- 6. care_visits table
CREATE TABLE care_visits (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at            timestamptz DEFAULT now() NOT NULL,
  agency_id             uuid NOT NULL REFERENCES care_agencies(id) ON DELETE CASCADE,
  care_worker_id        uuid NOT NULL REFERENCES care_workers(id) ON DELETE CASCADE,
  member_id             uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  scheduled_date        date NOT NULL,
  scheduled_start_time  time NOT NULL,
  scheduled_end_time    time NOT NULL,
  actual_check_in_at    timestamptz,
  actual_check_out_at   timestamptz,
  duration_minutes      int,
  visit_type            agency_visit_type NOT NULL DEFAULT 'personal_care',
  status                agency_visit_status NOT NULL DEFAULT 'scheduled',
  care_worker_notes     text,
  supervisor_notes      text,
  billing_code          text,
  billable_hours        numeric,
  invoiced              boolean NOT NULL DEFAULT false
);
ALTER TABLE care_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_care_visits" ON care_visits FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.supabase_auth_id = auth.uid() AND fm.role = 'admin'
  ));
CREATE POLICY "agency_admin_own_visits" ON care_visits FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.supabase_auth_id = auth.uid()
      AND fm.role = 'agency_admin'
      AND fm.agency_id = care_visits.agency_id
  ));
CREATE POLICY "care_worker_read_own_visits" ON care_visits FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM care_workers cw
    WHERE cw.id = care_visits.care_worker_id AND cw.supabase_auth_id = auth.uid()
  ));
CREATE POLICY "care_worker_update_own_visits" ON care_visits FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM care_workers cw
    WHERE cw.id = care_visits.care_worker_id AND cw.supabase_auth_id = auth.uid()
  ));
CREATE POLICY "family_read_own_care_visits" ON care_visits FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.member_id = care_visits.member_id AND fm.supabase_auth_id = auth.uid()
  ));
CREATE POLICY "navigator_read_care_visits" ON care_visits FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM care_navigators cn WHERE cn.supabase_auth_id = auth.uid()
  ));

-- Indexes for care_visits
CREATE INDEX idx_care_visits_agency_date ON care_visits(agency_id, scheduled_date DESC);
CREATE INDEX idx_care_visits_worker ON care_visits(care_worker_id, scheduled_date);
CREATE INDEX idx_care_visits_member ON care_visits(member_id);

-- 7. agency_referrals table
CREATE TABLE agency_referrals (
  id                     uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at             timestamptz DEFAULT now() NOT NULL,
  member_id              uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  referring_navigator_id uuid REFERENCES care_navigators(id) ON DELETE SET NULL,
  agency_id              uuid REFERENCES care_agencies(id) ON DELETE SET NULL,
  status                 referral_status NOT NULL DEFAULT 'pending',
  referral_reason        text,
  services_requested     text[] DEFAULT '{}',
  notes                  text,
  responded_at           timestamptz
);
ALTER TABLE agency_referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_referrals" ON agency_referrals FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.supabase_auth_id = auth.uid() AND fm.role = 'admin'
  ));
CREATE POLICY "navigator_all_referrals" ON agency_referrals FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM care_navigators cn WHERE cn.supabase_auth_id = auth.uid()
  ));
CREATE POLICY "agency_read_own_referrals" ON agency_referrals FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.supabase_auth_id = auth.uid()
      AND fm.role = 'agency_admin'
      AND fm.agency_id = agency_referrals.agency_id
  ));

-- 8. Seed: one test agency so the portal is testable
INSERT INTO care_agencies (name, agency_type, contact_name, contact_email, contact_phone, city, state, status)
VALUES ('Golden Gate Home Care', 'home_health', 'Sarah Torres', 'sarah@goldengatehomecare.test', '(415) 555-0100', 'San Francisco', 'CA', 'active')
ON CONFLICT DO NOTHING;
