-- Migration 045: Area Agency on Aging Portal (Phase 64 — M20)
-- Tables for multi-county AAA management, Title III service tracking, and NAPIS export.
-- Human must run in Supabase SQL Editor.

-- Add aaa_admin role to user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'aaa_admin';

-- Add aaa_id FK to family_members so an aaa_admin can be linked to their AAA
ALTER TABLE family_members ADD COLUMN IF NOT EXISTS aaa_id uuid;

-- Area Agencies on Aging
CREATE TABLE IF NOT EXISTS area_agencies_on_aging (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at            timestamptz DEFAULT now() NOT NULL,
  updated_at            timestamptz DEFAULT now() NOT NULL,
  agency_name           text NOT NULL,
  psa_number            text,
  state                 text NOT NULL DEFAULT 'CA',
  contact_name          text NOT NULL,
  contact_email         text NOT NULL,
  contact_phone         text,
  address               text,
  city                  text,
  zip_code              text,
  counties_served       text[] DEFAULT '{}',
  fiscal_year_start     int NOT NULL DEFAULT 7,
  annual_title3_budget_cents bigint,
  is_active             boolean NOT NULL DEFAULT true
);
ALTER TABLE area_agencies_on_aging ENABLE ROW LEVEL SECURITY;
CREATE POLICY "aaa_admin_own_agency" ON area_agencies_on_aging FOR ALL
  USING (EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.supabase_auth_id = auth.uid()
    AND fm.aaa_id = area_agencies_on_aging.id
  ));
CREATE POLICY "admin_all_aaa" ON area_agencies_on_aging FOR ALL
  USING (EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.supabase_auth_id = auth.uid()
    AND fm.role = 'admin'
  ));

-- Title III service categories as a type for documentation clarity
-- Values: III-B (Supportive), III-C1 (Congregate Meals), III-C2 (Home-Delivered Meals),
--         III-D (Disease Prevention), III-E (Family Caregiver Support)
CREATE TABLE IF NOT EXISTS aaa_service_units (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at            timestamptz DEFAULT now() NOT NULL,
  aaa_id                uuid NOT NULL REFERENCES area_agencies_on_aging(id) ON DELETE CASCADE,
  member_id             uuid REFERENCES members(id) ON DELETE SET NULL,
  service_date          date NOT NULL,
  title3_category       text NOT NULL CHECK (title3_category IN ('III-B','III-C1','III-C2','III-D','III-E')),
  service_type          text NOT NULL,
  units_provided        numeric NOT NULL DEFAULT 1,
  unit_type             text NOT NULL DEFAULT 'hour' CHECK (unit_type IN ('hour','meal','trip','session','contact')),
  county                text,
  -- OAA demographic fields for NAPIS reporting (nullable — filled for non-member clients)
  client_age_group      text CHECK (client_age_group IN ('60-64','65-74','75-84','85+') OR client_age_group IS NULL),
  client_gender         text CHECK (client_gender IN ('male','female','non_binary','not_reported') OR client_gender IS NULL),
  poverty_status        boolean,
  minority_status       boolean,
  rural_status          boolean,
  disability_status     boolean,
  at_risk_status        boolean,
  nutritional_risk      boolean,
  lives_alone           boolean,
  worker_name           text,
  notes                 text,
  fiscal_year           int NOT NULL DEFAULT EXTRACT(year FROM now())
);
ALTER TABLE aaa_service_units ENABLE ROW LEVEL SECURITY;
CREATE POLICY "aaa_admin_own_units" ON aaa_service_units FOR ALL
  USING (EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.supabase_auth_id = auth.uid()
    AND fm.aaa_id = aaa_service_units.aaa_id
  ));
CREATE POLICY "admin_all_units" ON aaa_service_units FOR ALL
  USING (EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.supabase_auth_id = auth.uid()
    AND fm.role = 'admin'
  ));

CREATE INDEX IF NOT EXISTS idx_aaa_units_aaa_id ON aaa_service_units(aaa_id);
CREATE INDEX IF NOT EXISTS idx_aaa_units_service_date ON aaa_service_units(service_date DESC);
CREATE INDEX IF NOT EXISTS idx_aaa_units_category ON aaa_service_units(title3_category);
CREATE INDEX IF NOT EXISTS idx_aaa_units_fiscal_year ON aaa_service_units(aaa_id, fiscal_year);

-- OAA client compliance assessment fields (separate from members table)
CREATE TABLE IF NOT EXISTS oaa_client_assessments (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at            timestamptz DEFAULT now() NOT NULL,
  updated_at            timestamptz DEFAULT now() NOT NULL,
  member_id             uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE UNIQUE,
  aaa_id                uuid NOT NULL REFERENCES area_agencies_on_aging(id) ON DELETE CASCADE,
  age_group             text,
  gender                text,
  race_ethnicity        text,
  poverty_status        boolean NOT NULL DEFAULT false,
  minority_status       boolean NOT NULL DEFAULT false,
  rural_status          boolean NOT NULL DEFAULT false,
  disability_status     boolean NOT NULL DEFAULT false,
  at_risk_institutional boolean NOT NULL DEFAULT false,
  nutritional_risk      boolean NOT NULL DEFAULT false,
  lives_alone           boolean,
  primary_language      text,
  county                text,
  last_assessed_at      date
);
ALTER TABLE oaa_client_assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "aaa_admin_own_assessments" ON oaa_client_assessments FOR ALL
  USING (EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.supabase_auth_id = auth.uid()
    AND fm.aaa_id = oaa_client_assessments.aaa_id
  ));
CREATE POLICY "admin_all_assessments" ON oaa_client_assessments FOR ALL
  USING (EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.supabase_auth_id = auth.uid()
    AND fm.role = 'admin'
  ));

CREATE INDEX IF NOT EXISTS idx_oaa_assessments_aaa ON oaa_client_assessments(aaa_id);

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ language 'plpgsql';

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_aaa_updated_at') THEN
    CREATE TRIGGER update_aaa_updated_at
      BEFORE UPDATE ON area_agencies_on_aging
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_oaa_assessments_updated_at') THEN
    CREATE TRIGGER update_oaa_assessments_updated_at
      BEFORE UPDATE ON oaa_client_assessments
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Add FK constraint on family_members.aaa_id (deferred so it doesn't fail if table didn't exist before)
ALTER TABLE family_members
  ADD CONSTRAINT IF NOT EXISTS fk_family_members_aaa_id
  FOREIGN KEY (aaa_id) REFERENCES area_agencies_on_aging(id) ON DELETE SET NULL;

-- Seed: Bay Area AAA (Serving San Francisco & Marin County)
INSERT INTO area_agencies_on_aging (agency_name, psa_number, state, contact_name, contact_email, contact_phone, city, counties_served, fiscal_year_start)
VALUES (
  'Bay Area Area Agency on Aging',
  'PSA-06',
  'CA',
  'Patricia Williams',
  'patricia.williams@bayareaaaa.org',
  '(415) 555-0190',
  'San Francisco',
  ARRAY['San Francisco', 'Marin', 'San Mateo'],
  7
)
ON CONFLICT DO NOTHING;
