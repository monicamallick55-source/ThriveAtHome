-- Phase 62: Multi-location Management for Home Care Agencies
-- Creates agency_locations table; links care_workers and care_visits to locations.

-- ── Agency Locations ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS agency_locations (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at       timestamptz DEFAULT now() NOT NULL,
  updated_at       timestamptz DEFAULT now() NOT NULL,
  agency_id        uuid NOT NULL REFERENCES care_agencies(id) ON DELETE CASCADE,
  location_name    text NOT NULL,
  address          text,
  city             text,
  state            text,
  zip_code         text,
  phone            text,
  is_headquarters  boolean NOT NULL DEFAULT false,
  is_active        boolean NOT NULL DEFAULT true,
  manager_name     text,
  manager_email    text,
  notes            text
);

ALTER TABLE agency_locations ENABLE ROW LEVEL SECURITY;

-- Agency admins manage their own agency's locations
CREATE POLICY "agency_admin_all_own_locations" ON agency_locations FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.agency_id = agency_locations.agency_id
      AND fm.supabase_auth_id = auth.uid()
      AND fm.role = 'agency_admin'
  )
);

-- Platform admins manage all locations
CREATE POLICY "admin_all_locations" ON agency_locations FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.supabase_auth_id = auth.uid()
      AND fm.role = 'admin'
  )
);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_agency_location_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER agency_locations_updated_at
  BEFORE UPDATE ON agency_locations
  FOR EACH ROW EXECUTE FUNCTION update_agency_location_updated_at();

-- ── Foreign keys from care_workers and care_visits ────────────────────────────

ALTER TABLE care_workers
  ADD COLUMN IF NOT EXISTS location_id uuid REFERENCES agency_locations(id) ON DELETE SET NULL;

ALTER TABLE care_visits
  ADD COLUMN IF NOT EXISTS location_id uuid REFERENCES agency_locations(id) ON DELETE SET NULL;

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_agency_locations_agency ON agency_locations(agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_locations_active ON agency_locations(agency_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_care_workers_location ON care_workers(location_id) WHERE location_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_care_visits_location ON care_visits(location_id) WHERE location_id IS NOT NULL;

-- ── Seed: headquarters for Golden Gate Home Care ──────────────────────────────

INSERT INTO agency_locations (agency_id, location_name, address, city, state, zip_code, phone, is_headquarters, is_active, manager_name)
SELECT
  ca.id,
  'Main Office',
  '450 Sutter Street, Suite 800',
  'San Francisco',
  'CA',
  '94108',
  '(415) 555-0100',
  true,
  true,
  ca.contact_name
FROM care_agencies ca
WHERE ca.name = 'Golden Gate Home Care'
ON CONFLICT DO NOTHING;
