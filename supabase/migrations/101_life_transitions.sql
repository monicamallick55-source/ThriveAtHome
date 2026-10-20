-- 101_life_transitions.sql
-- G5.5 — Life transitions depth
-- 1. Facility-move planning tables (transition_plans + transition_plan_steps)
-- 2. Extend trusted_advisors with therapist / grief_counselor / chaplain categories
-- 3. advisor_connections table (warm introduction requests)

-- ── 1. Facility-move planning ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS transition_plans (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at          timestamptz DEFAULT now() NOT NULL,
  updated_at          timestamptz DEFAULT now() NOT NULL,
  member_id           uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  navigator_id        uuid REFERENCES family_members(id) ON DELETE SET NULL,
  title               text NOT NULL DEFAULT 'Facility Move Plan',
  status              text NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active', 'completed', 'cancelled')),
  family_can_view      boolean NOT NULL DEFAULT false,
  target_move_date    date,
  facility_name       text,
  facility_address    text,
  notes               text
);

CREATE TABLE IF NOT EXISTS transition_plan_steps (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at          timestamptz DEFAULT now() NOT NULL,
  plan_id             uuid NOT NULL REFERENCES transition_plans(id) ON DELETE CASCADE,
  week_number         integer NOT NULL CHECK (week_number BETWEEN 1 AND 6),
  title               text NOT NULL,
  description         text,
  due_date            date,
  completed_at        timestamptz,
  completed_by        uuid REFERENCES family_members(id) ON DELETE SET NULL,
  category            text NOT NULL DEFAULT 'general'
                        CHECK (category IN ('research','visits','transport','paperwork','family','moving','post_move','general')),
  sort_order          integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS transition_plans_member_idx ON transition_plans(member_id);
CREATE INDEX IF NOT EXISTS transition_plan_steps_plan_idx ON transition_plan_steps(plan_id);

ALTER TABLE transition_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE transition_plan_steps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "member sees own transition plans" ON transition_plans;
CREATE POLICY "member sees own transition plans"
  ON transition_plans FOR SELECT
  USING (member_id = ANY(acting_member_ids()));

DROP POLICY IF EXISTS "family sees plans when allowed" ON transition_plans;
CREATE POLICY "family sees plans when allowed"
  ON transition_plans FOR SELECT
  USING (
    family_can_view AND member_id IN (
      SELECT member_id FROM family_members WHERE supabase_auth_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "staff manages transition plans" ON transition_plans;
CREATE POLICY "staff manages transition plans"
  ON transition_plans FOR ALL
  USING (is_staff());

DROP POLICY IF EXISTS "member sees own plan steps" ON transition_plan_steps;
CREATE POLICY "member sees own plan steps"
  ON transition_plan_steps FOR SELECT
  USING (plan_id IN (
    SELECT id FROM transition_plans WHERE member_id = ANY(acting_member_ids())
  ));

DROP POLICY IF EXISTS "family sees steps when plan allows" ON transition_plan_steps;
CREATE POLICY "family sees steps when plan allows"
  ON transition_plan_steps FOR SELECT
  USING (plan_id IN (
    SELECT id FROM transition_plans
    WHERE family_can_view
      AND member_id IN (
        SELECT member_id FROM family_members WHERE supabase_auth_id = auth.uid()
      )
  ));

DROP POLICY IF EXISTS "staff manages plan steps" ON transition_plan_steps;
CREATE POLICY "staff manages plan steps"
  ON transition_plan_steps FOR ALL
  USING (is_staff());

-- updated_at trigger
CREATE OR REPLACE FUNCTION touch_transition_plan()
  RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS transition_plans_updated ON transition_plans;
CREATE TRIGGER transition_plans_updated
  BEFORE UPDATE ON transition_plans
  FOR EACH ROW EXECUTE FUNCTION touch_transition_plan();

-- ── 2. Extend trusted_advisors ────────────────────────────────────────────────
-- Add new professional categories + license fields + telehealth flag
-- (trusted_advisors table was created in migration 065)

ALTER TABLE trusted_advisors
  ADD COLUMN IF NOT EXISTS license_number    text,
  ADD COLUMN IF NOT EXISTS license_state     text,
  ADD COLUMN IF NOT EXISTS telehealth_ok     boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS member_request_only boolean NOT NULL DEFAULT false;

-- advisor_type is a Postgres enum (public.advisor_type).
-- Add therapist, grief_counselor, chaplain values if not already present.
DO $$ BEGIN
  ALTER TYPE advisor_type ADD VALUE IF NOT EXISTS 'therapist';
EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE advisor_type ADD VALUE IF NOT EXISTS 'grief_counselor';
EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE advisor_type ADD VALUE IF NOT EXISTS 'chaplain';
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ── 3. advisor_connections — warm introduction requests ───────────────────────

CREATE TABLE IF NOT EXISTS advisor_connections (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at          timestamptz DEFAULT now() NOT NULL,
  updated_at          timestamptz DEFAULT now() NOT NULL,
  member_id           uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  advisor_id          uuid NOT NULL REFERENCES trusted_advisors(id) ON DELETE CASCADE,
  status              text NOT NULL DEFAULT 'requested'
                        CHECK (status IN ('requested','navigator_reviewing','intro_sent','connected','declined')),
  member_note         text,
  navigator_notes     text,
  introduced_at       timestamptz,
  UNIQUE (member_id, advisor_id)
);

CREATE INDEX IF NOT EXISTS advisor_connections_member_idx ON advisor_connections(member_id);
CREATE INDEX IF NOT EXISTS advisor_connections_advisor_idx ON advisor_connections(advisor_id);

ALTER TABLE advisor_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "member manages own advisor connections" ON advisor_connections;
CREATE POLICY "member manages own advisor connections"
  ON advisor_connections FOR ALL
  USING (member_id = ANY(acting_member_ids()));

DROP POLICY IF EXISTS "staff manages all advisor connections" ON advisor_connections;
CREATE POLICY "staff manages all advisor connections"
  ON advisor_connections FOR ALL
  USING (is_staff());
