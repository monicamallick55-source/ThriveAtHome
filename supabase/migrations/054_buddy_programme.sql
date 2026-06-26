-- Phase 33a: Human Buddy Programme
-- Creates buddy_assignments, buddy_calls, and extends volunteers + members tables.

-- ── buddy_assignments ─────────────────────────────────────────────────────────
CREATE TABLE buddy_assignments (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at          timestamptz DEFAULT now() NOT NULL,
  member_id           uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  volunteer_id        uuid NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,
  assigned_at         timestamptz NOT NULL DEFAULT now(),
  status              text NOT NULL DEFAULT 'active',
  -- active | paused | ending | ended
  call_frequency      text NOT NULL DEFAULT 'weekly',
  -- weekly | biweekly
  preferred_call_day  text,
  preferred_call_time text,
  match_score         int NOT NULL DEFAULT 0,
  match_reasons       jsonb NOT NULL DEFAULT '[]',
  navigator_notes     text,
  ended_at            timestamptz,
  end_reason          text,
  transition_buddy_id uuid REFERENCES volunteers(id) ON DELETE SET NULL
);
ALTER TABLE buddy_assignments ENABLE ROW LEVEL SECURITY;

-- Family can see their own buddy assignment (no concern_description here, that's in buddy_calls)
CREATE POLICY "family_select_own_buddy_assignment" ON buddy_assignments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.member_id = buddy_assignments.member_id
      AND fm.supabase_auth_id = auth.uid()
  ));

-- Navigators can see and manage all assignments
CREATE POLICY "navigator_all_buddy_assignments" ON buddy_assignments FOR ALL
  USING (EXISTS (
    SELECT 1 FROM care_navigators cn WHERE cn.supabase_auth_id = auth.uid()
  ));

-- Admin can see all
CREATE POLICY "admin_all_buddy_assignments" ON buddy_assignments FOR ALL
  USING (EXISTS (
    SELECT 1 FROM family_members fm WHERE fm.supabase_auth_id = auth.uid() AND fm.role = 'admin'
  ));

CREATE INDEX idx_buddy_assignments_member ON buddy_assignments(member_id);
CREATE INDEX idx_buddy_assignments_volunteer ON buddy_assignments(volunteer_id);
CREATE INDEX idx_buddy_assignments_status ON buddy_assignments(status);

-- ── buddy_calls ───────────────────────────────────────────────────────────────
CREATE TABLE buddy_calls (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at            timestamptz DEFAULT now() NOT NULL,
  assignment_id         uuid NOT NULL REFERENCES buddy_assignments(id) ON DELETE CASCADE,
  member_id             uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  volunteer_id          uuid NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,
  scheduled_at          timestamptz,
  started_at            timestamptz,
  duration_minutes      int,
  call_quality          int CHECK (call_quality BETWEEN 1 AND 5),
  buddy_notes           text,
  -- volunteer-facing notes visible to navigator
  family_note           text,
  -- shared with family — optional, volunteer decides what to share
  concern_flag          boolean NOT NULL DEFAULT false,
  concern_description   text,
  -- NAVIGATOR-ONLY: never shown to family
  milestone_flag        boolean NOT NULL DEFAULT false,
  milestone_description text,
  aria_brief_shown      boolean NOT NULL DEFAULT false,
  aria_context_snapshot jsonb
);
ALTER TABLE buddy_calls ENABLE ROW LEVEL SECURITY;

-- Family can see buddy calls but NOT concern_description (enforced in app layer + views)
CREATE POLICY "family_select_own_buddy_calls" ON buddy_calls FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.member_id = buddy_calls.member_id
      AND fm.supabase_auth_id = auth.uid()
  ));

-- Navigators can see and manage all buddy calls
CREATE POLICY "navigator_all_buddy_calls" ON buddy_calls FOR ALL
  USING (EXISTS (
    SELECT 1 FROM care_navigators cn WHERE cn.supabase_auth_id = auth.uid()
  ));

-- Admin can see all
CREATE POLICY "admin_all_buddy_calls" ON buddy_calls FOR ALL
  USING (EXISTS (
    SELECT 1 FROM family_members fm WHERE fm.supabase_auth_id = auth.uid() AND fm.role = 'admin'
  ));

CREATE INDEX idx_buddy_calls_assignment ON buddy_calls(assignment_id);
CREATE INDEX idx_buddy_calls_member ON buddy_calls(member_id);
CREATE INDEX idx_buddy_calls_volunteer ON buddy_calls(volunteer_id);
CREATE INDEX idx_buddy_calls_concern ON buddy_calls(concern_flag) WHERE concern_flag = true;

-- ── Extend volunteers table ───────────────────────────────────────────────────
ALTER TABLE volunteers
  ADD COLUMN IF NOT EXISTS buddy_capacity int NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS buddy_active_count int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS buddy_preferences jsonb,
  ADD COLUMN IF NOT EXISTS buddy_bio text;

-- ── Extend members table ──────────────────────────────────────────────────────
ALTER TABLE members
  ADD COLUMN IF NOT EXISTS buddy_match_topics text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS buddy_match_era text,
  ADD COLUMN IF NOT EXISTS buddy_call_length_preference text,
  ADD COLUMN IF NOT EXISTS buddy_intro_note text,
  ADD COLUMN IF NOT EXISTS has_active_buddy boolean NOT NULL DEFAULT false;
