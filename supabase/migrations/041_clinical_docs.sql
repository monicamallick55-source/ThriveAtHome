-- Phase 61: Clinical Documentation — SOAP notes and care plan versioning for home care agencies
-- Run in Supabase SQL Editor after 040_brand_configs.sql

CREATE TYPE soap_note_status AS ENUM ('draft', 'signed', 'locked');

CREATE TABLE soap_notes (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at       timestamptz DEFAULT now() NOT NULL,
  updated_at       timestamptz DEFAULT now() NOT NULL,
  member_id        uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  agency_id        uuid NOT NULL REFERENCES care_agencies(id) ON DELETE CASCADE,
  care_worker_id   uuid REFERENCES care_workers(id) ON DELETE SET NULL,
  visit_id         uuid REFERENCES care_visits(id) ON DELETE SET NULL,

  -- SOAP fields
  subjective       text NOT NULL DEFAULT '',
  objective        text NOT NULL DEFAULT '',
  assessment       text NOT NULL DEFAULT '',
  plan             text NOT NULL DEFAULT '',

  -- Medicare / home health billing codes
  billing_codes    text[] DEFAULT '{}',

  -- Sign and lock
  status           soap_note_status NOT NULL DEFAULT 'draft',
  signed_by_name   text,
  signed_at        timestamptz,
  locked_at        timestamptz,

  -- Metadata
  note_date        date NOT NULL DEFAULT CURRENT_DATE,
  visit_type       text,
  duration_minutes int
);
ALTER TABLE soap_notes ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_soap_notes_member ON soap_notes(member_id, note_date DESC);
CREATE INDEX idx_soap_notes_agency ON soap_notes(agency_id, created_at DESC);

-- Agency admin can manage all notes for their agency
CREATE POLICY "agency_admin_all_soap_notes" ON soap_notes FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.supabase_auth_id = auth.uid()
      AND fm.role = 'agency_admin'
      AND fm.agency_id = soap_notes.agency_id
  )
);

-- Care workers can read notes linked to their visits
CREATE POLICY "care_worker_read_own_visit_notes" ON soap_notes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM care_workers cw
    WHERE cw.supabase_auth_id = auth.uid()
      AND cw.id = soap_notes.care_worker_id
  )
);

-- Care workers can insert and update their own draft notes
CREATE POLICY "care_worker_insert_notes" ON soap_notes FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM care_workers cw
    WHERE cw.supabase_auth_id = auth.uid()
      AND cw.id = soap_notes.care_worker_id
  )
);

CREATE POLICY "care_worker_update_draft_notes" ON soap_notes FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM care_workers cw
    WHERE cw.supabase_auth_id = auth.uid()
      AND cw.id = soap_notes.care_worker_id
  )
  AND status = 'draft'
);

-- Navigators can read notes for members they are assigned to
CREATE POLICY "navigator_read_assigned_soap_notes" ON soap_notes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM care_navigators cn
    JOIN navigator_assignments na ON na.navigator_id = cn.id
    WHERE cn.supabase_auth_id = auth.uid()
      AND na.member_id = soap_notes.member_id
  )
);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_soap_notes_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER soap_notes_updated_at BEFORE UPDATE ON soap_notes
FOR EACH ROW EXECUTE FUNCTION update_soap_notes_updated_at();

-- ─── Care Plan Versions ────────────────────────────────────────────────

CREATE TABLE care_plan_versions (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at       timestamptz DEFAULT now() NOT NULL,
  updated_at       timestamptz DEFAULT now() NOT NULL,
  member_id        uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  agency_id        uuid NOT NULL REFERENCES care_agencies(id) ON DELETE CASCADE,
  version_number   int NOT NULL DEFAULT 1,

  -- Plan content
  goals            text NOT NULL DEFAULT '',
  interventions    text NOT NULL DEFAULT '',
  visit_frequency  text NOT NULL DEFAULT '',
  diagnoses        text[] DEFAULT '{}',
  functional_status text,
  safety_concerns  text,

  -- Approval
  status           text NOT NULL DEFAULT 'draft',  -- draft | active | superseded
  approved_by_name text,
  approved_at      timestamptz,
  effective_date   date,
  review_date      date,

  notes            text
);
ALTER TABLE care_plan_versions ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_care_plans_member ON care_plan_versions(member_id, version_number DESC);
CREATE INDEX idx_care_plans_agency ON care_plan_versions(agency_id, created_at DESC);

CREATE POLICY "agency_admin_all_care_plans" ON care_plan_versions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.supabase_auth_id = auth.uid()
      AND fm.role = 'agency_admin'
      AND fm.agency_id = care_plan_versions.agency_id
  )
);

CREATE POLICY "navigator_read_assigned_care_plans" ON care_plan_versions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM care_navigators cn
    JOIN navigator_assignments na ON na.navigator_id = cn.id
    WHERE cn.supabase_auth_id = auth.uid()
      AND na.member_id = care_plan_versions.member_id
  )
);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_care_plans_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER care_plans_updated_at BEFORE UPDATE ON care_plan_versions
FOR EACH ROW EXECUTE FUNCTION update_care_plans_updated_at();
