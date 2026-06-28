-- M21: Expanded Volunteer Ecosystem
-- Phases 81-86: Retired Professionals, Faith Chaplaincy, Neighbor Volunteers,
-- Family Reciprocity, Member Ambassadors, Youth K-12 Curriculum

-- Extend volunteers table with M21 attributes
ALTER TABLE volunteers
  ADD COLUMN IF NOT EXISTS volunteer_specialty text,
  -- retired professional specialty:
  -- tax_help, legal_guidance, medical_support, tech_instruction,
  -- financial_planning, career_counseling, language_tutoring, fitness_wellness, other
  ADD COLUMN IF NOT EXISTS professional_background text,
  ADD COLUMN IF NOT EXISTS faith_affiliation text,
  -- christian, jewish, muslim, hindu, buddhist, sikh, unitarian, secular, other
  ADD COLUMN IF NOT EXISTS is_chaplain boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_neighbor_volunteer boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_family_reciprocal boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS zip_code text;

-- K-12 school partner accounts (builds on Phase 32 university student_volunteers)
CREATE TABLE IF NOT EXISTS k12_schools (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  school_name text NOT NULL,
  contact_name text NOT NULL,
  contact_email text NOT NULL,
  school_type text NOT NULL DEFAULT 'high_school',
  -- elementary, middle, high_school, k12_combined
  grade_levels text[] DEFAULT '{}',
  city text,
  state text,
  program_types text[] DEFAULT '{}',
  -- pen_pals, life_stories, mentorship_reversal
  active_student_count int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending'
);
ALTER TABLE k12_schools ENABLE ROW LEVEL SECURITY;

-- K-12 student registrations (parental consent via school; no minor email stored)
CREATE TABLE IF NOT EXISTS k12_student_volunteers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  school_id uuid NOT NULL REFERENCES k12_schools(id) ON DELETE CASCADE,
  student_name text NOT NULL,
  grade_level text,
  program_type text NOT NULL,
  -- pen_pals, life_stories, mentorship_reversal
  member_id uuid REFERENCES members(id) ON DELETE SET NULL,
  total_hours_logged numeric NOT NULL DEFAULT 0,
  sessions_completed int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active'
);
ALTER TABLE k12_student_volunteers ENABLE ROW LEVEL SECURITY;

-- Family volunteer reciprocity links
-- Tracks which volunteers are family members of enrolled seniors
CREATE TABLE IF NOT EXISTS family_volunteer_links (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  volunteer_id uuid NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,
  family_member_id uuid NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  linked_member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  UNIQUE(volunteer_id, family_member_id)
);
ALTER TABLE family_volunteer_links ENABLE ROW LEVEL SECURITY;

-- Member ambassador programme
CREATE TABLE IF NOT EXISTS member_ambassadors (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE UNIQUE,
  nominated_by uuid REFERENCES care_navigators(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active',
  ambassador_since date NOT NULL DEFAULT CURRENT_DATE,
  specialties text[] DEFAULT '{}',
  -- onboarding_support, event_hosting, circle_moderation, cultural_liaison
  total_new_members_welcomed int NOT NULL DEFAULT 0,
  total_events_hosted int NOT NULL DEFAULT 0,
  notes text
);
ALTER TABLE member_ambassadors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone_read_ambassadors" ON member_ambassadors FOR SELECT USING (true);
CREATE POLICY "family_manage_own_ambassador" ON member_ambassadors FOR ALL
  USING (EXISTS (SELECT 1 FROM family_members fm
    WHERE fm.member_id = member_ambassadors.member_id
    AND fm.supabase_auth_id = auth.uid()));

-- Add zip_code to members for neighbor matching (if not present)
ALTER TABLE members ADD COLUMN IF NOT EXISTS zip_code text;

-- Add faith_preference to members for chaplain matching
ALTER TABLE members ADD COLUMN IF NOT EXISTS faith_preference text;
