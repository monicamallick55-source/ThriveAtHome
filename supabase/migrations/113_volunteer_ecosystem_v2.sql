-- Migration 113: G7.7–G7.13 — Volunteer Ecosystem Completion
-- Adds: university_partners, school_partners, professional specialty,
--       neighbor volunteer category, zip-code enforcement, K-12 curriculum activities

-- ── G7.7: University partners ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS university_partners (
  id                 uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at         timestamptz DEFAULT now() NOT NULL,
  name               text NOT NULL,
  slug               text NOT NULL UNIQUE,
  contact_name       text NOT NULL,
  contact_email      text NOT NULL,
  active             boolean NOT NULL DEFAULT true,
  semester_start     date,
  semester_end       date,
  hour_target        integer NOT NULL DEFAULT 40,    -- required service hours
  enrolled_students  integer NOT NULL DEFAULT 0,
  notes              text
);

ALTER TABLE university_partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "univ_staff_all" ON university_partners FOR ALL USING (is_staff());

-- Link volunteers to university partner
ALTER TABLE volunteers
  ADD COLUMN IF NOT EXISTS university_partner_id uuid REFERENCES university_partners(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS student_id_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS professional_specialty text;  -- e.g. 'attorney', 'cpa', 'physician', 'nurse', 'engineer'

-- ── G7.8: VSO partner portals ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS vso_partners (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at   timestamptz DEFAULT now() NOT NULL,
  name         text NOT NULL,
  slug         text NOT NULL UNIQUE,
  affiliation  text NOT NULL,   -- maps to vso_affiliation enum values
  contact_name text NOT NULL,
  contact_email text NOT NULL,
  active       boolean NOT NULL DEFAULT true
);

ALTER TABLE vso_partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vso_staff_all" ON vso_partners FOR ALL USING (is_staff());

-- ── G7.9: K-12 school partners + activity types ───────────────────────────────

CREATE TABLE IF NOT EXISTS school_partners (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at      timestamptz DEFAULT now() NOT NULL,
  name            text NOT NULL,
  slug            text NOT NULL UNIQUE,
  contact_name    text NOT NULL,
  contact_email   text NOT NULL,
  grade_band      text NOT NULL CHECK (grade_band IN ('k_5', '6_8', '9_12', 'mixed')),
  active          boolean NOT NULL DEFAULT true,
  student_count   integer NOT NULL DEFAULT 0
);

ALTER TABLE school_partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "school_staff_all" ON school_partners FOR ALL USING (is_staff());

-- K-12 activity catalog (curated by grade band)
CREATE TABLE IF NOT EXISTS youth_activity_types (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  grade_band   text NOT NULL CHECK (grade_band IN ('k_5', '6_8', '9_12')),
  name         text NOT NULL,
  description  text NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 60,
  materials    text[],
  active       boolean NOT NULL DEFAULT true
);

-- Seed K-12 activities
INSERT INTO youth_activity_types (grade_band, name, description, duration_minutes)
VALUES
  ('k_5',  'Story Time Together',        'Student reads a picture book aloud to a senior and they discuss the story.', 30),
  ('k_5',  'Art & Craft Exchange',       'Students and seniors create simple art together; swap finished pieces as keepsakes.', 60),
  ('k_5',  'Letter Writing',             'Students write and decorate a letter for a senior pen pal.', 45),
  ('6_8',  'Technology Help Session',    'Middle schoolers teach seniors to use smartphones, video calls, or email.', 60),
  ('6_8',  'Oral History Interview',     'Students interview a senior about a historical event they lived through.', 60),
  ('6_8',  'Garden & Nature Project',    'Students and seniors plant seeds together or work in a community garden.', 90),
  ('9_12', 'Career Conversation',        'Senior shares career wisdom; student shares current interests and goals.', 45),
  ('9_12', 'Service-Learning Reflection','Students document their service experience and share it with the senior.', 60),
  ('9_12', 'Digital Life Review',        'Students help a senior create a digital photo album or family history document.', 90)
ON CONFLICT DO NOTHING;

-- ── G7.12: Neighbor volunteer category ────────────────────────────────────────

-- Ensure volunteer_category column exists with neighbor option
DO $$ BEGIN
  ALTER TABLE volunteers ADD COLUMN IF NOT EXISTS volunteer_category text NOT NULL DEFAULT 'general';
EXCEPTION WHEN others THEN NULL; END $$;

-- Enforce zip-code match for neighbor volunteers (stored on volunteers table)
ALTER TABLE volunteers
  ADD COLUMN IF NOT EXISTS zip_code text,
  ADD COLUMN IF NOT EXISTS background_check_required boolean NOT NULL DEFAULT true;

-- Neighbor volunteers skip background check; navigator must approve each match
CREATE TABLE IF NOT EXISTS neighbor_match_requests (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at      timestamptz DEFAULT now() NOT NULL,
  volunteer_id    uuid NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,
  member_id       uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','declined','completed')),
  navigator_note  text,
  approved_by     uuid REFERENCES family_members(id) ON DELETE SET NULL,
  approved_at     timestamptz
);

ALTER TABLE neighbor_match_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "nmr_staff_all" ON neighbor_match_requests FOR ALL USING (is_staff());
CREATE POLICY "nmr_member_read" ON neighbor_match_requests FOR SELECT USING (member_id = ANY(acting_member_ids()));

-- ── G7.13: Family reciprocity guard ──────────────────────────────────────────
-- The guard that family volunteers NEVER match to their own senior is enforced in API.
-- We add a helper index to make lookups fast.
CREATE INDEX IF NOT EXISTS time_bank_credits_performed_for_idx
  ON time_bank_credits(performed_for_member_id);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS volunteers_university_idx ON volunteers(university_partner_id);
CREATE INDEX IF NOT EXISTS volunteers_category_idx ON volunteers(volunteer_category);
CREATE INDEX IF NOT EXISTS volunteers_zip_idx ON volunteers(zip_code);
CREATE INDEX IF NOT EXISTS volunteers_specialty_idx ON volunteers(professional_specialty);
