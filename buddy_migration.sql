-- Phase 33a: Buddy Programme Database Migration
-- Run this in Supabase SQL Editor

DO $$ BEGIN
  CREATE TYPE buddy_assignment_status AS ENUM ('active', 'paused', 'ending', 'ended');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE buddy_call_frequency AS ENUM ('weekly', 'biweekly');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE volunteers
  ADD COLUMN IF NOT EXISTS buddy_capacity int DEFAULT 3,
  ADD COLUMN IF NOT EXISTS buddy_active_count int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS buddy_preferences jsonb,
  ADD COLUMN IF NOT EXISTS buddy_bio text;

ALTER TABLE members
  ADD COLUMN IF NOT EXISTS buddy_match_topics text[],
  ADD COLUMN IF NOT EXISTS buddy_match_era text,
  ADD COLUMN IF NOT EXISTS buddy_call_length_preference text,
  ADD COLUMN IF NOT EXISTS buddy_intro_note text,
  ADD COLUMN IF NOT EXISTS has_active_buddy boolean DEFAULT false;

CREATE TABLE IF NOT EXISTS buddy_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  volunteer_id uuid NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  status buddy_assignment_status NOT NULL DEFAULT 'active',
  call_frequency buddy_call_frequency NOT NULL DEFAULT 'weekly',
  preferred_call_day text,
  preferred_call_time text,
  match_score int,
  match_reasons jsonb,
  navigator_notes text,
  ended_at timestamptz,
  end_reason text,
  transition_buddy_id uuid REFERENCES volunteers(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS buddy_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES buddy_assignments(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  volunteer_id uuid NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,
  scheduled_at timestamptz,
  started_at timestamptz,
  duration_minutes int,
  call_quality int CHECK (call_quality BETWEEN 1 AND 5),
  buddy_notes text,
  family_note text,
  concern_flag boolean DEFAULT false,
  concern_description text,
  milestone_flag boolean DEFAULT false,
  milestone_description text,
  aria_brief_shown boolean DEFAULT false,
  aria_context_snapshot jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS buddy_assignments_member_id_idx ON buddy_assignments(member_id);
CREATE INDEX IF NOT EXISTS buddy_assignments_volunteer_id_idx ON buddy_assignments(volunteer_id);
CREATE INDEX IF NOT EXISTS buddy_calls_assignment_id_idx ON buddy_calls(assignment_id);
CREATE INDEX IF NOT EXISTS buddy_calls_member_id_idx ON buddy_calls(member_id);
CREATE INDEX IF NOT EXISTS buddy_calls_concern_flag_idx ON buddy_calls(concern_flag) WHERE concern_flag = true;

ALTER TABLE buddy_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE buddy_calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "buddies_select_own_assignments"
  ON buddy_assignments FOR SELECT
  USING (volunteer_id IN (SELECT id FROM volunteers WHERE supabase_auth_id = auth.uid()));

CREATE POLICY IF NOT EXISTS "admins_all_assignments"
  ON buddy_assignments FOR ALL
  USING (EXISTS (SELECT 1 FROM staff WHERE supabase_auth_id = auth.uid() AND role IN ('admin','navigator','super_admin')));

CREATE POLICY IF NOT EXISTS "buddies_manage_own_calls"
  ON buddy_calls FOR ALL
  USING (volunteer_id IN (SELECT id FROM volunteers WHERE supabase_auth_id = auth.uid()));

CREATE POLICY IF NOT EXISTS "admins_all_buddy_calls"
  ON buddy_calls FOR ALL
  USING (EXISTS (SELECT 1 FROM staff WHERE supabase_auth_id = auth.uid() AND role IN ('admin','navigator','super_admin')));
