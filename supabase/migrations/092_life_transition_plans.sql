-- Migration 092: G5.5 Life transitions planning tables
-- (SQL already applied in Supabase — file for version control)

CREATE TABLE IF NOT EXISTS transition_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  life_transition_id uuid REFERENCES life_transitions(id),
  plan_type text NOT NULL CHECK (plan_type IN ('facility_move','aging_in_place','care_level_change','other')),
  title text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','completed','cancelled')),
  target_date date,
  notes text,
  created_by uuid REFERENCES members(id),
  navigator_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transition_plan_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES transition_plans(id) ON DELETE CASCADE,
  step_order integer NOT NULL DEFAULT 0,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','skipped')),
  due_date date,
  completed_at timestamptz,
  assigned_to text,
  created_at timestamptz NOT NULL DEFAULT now()
);
