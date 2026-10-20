-- Migration 116: G7.5 Birthday arc opt-out + arc state tracking
-- Adds celebration_opt_out to members and birthday_arc_state for dedup

-- 1. Opt-out column on members
ALTER TABLE members
  ADD COLUMN IF NOT EXISTS celebration_opt_out boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN members.celebration_opt_out IS
  'G7.5 — when true, all birthday arc cron steps are skipped for this member';

-- 2. Birthday arc state table — tracks which steps have fired per member per year
--    Used to: (a) mark arc completed, (b) avoid duplicate sends on cron re-runs
CREATE TABLE IF NOT EXISTS birthday_arc_state (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at   timestamptz DEFAULT now() NOT NULL,
  updated_at   timestamptz DEFAULT now() NOT NULL,
  member_id    uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  arc_year     int  NOT NULL,  -- calendar year of the birthday this arc covers
  step         text NOT NULL,  -- 'd_minus_5' | 'd_minus_3' | 'd_minus_1' | 'd_zero' | 'd_plus_1'
  fired_at     timestamptz,
  status       text NOT NULL DEFAULT 'pending', -- 'pending' | 'fired' | 'skipped'
  skip_reason  text,           -- 'grief_guard' | 'opt_out' | null

  UNIQUE (member_id, arc_year, step)
);

ALTER TABLE birthday_arc_state ENABLE ROW LEVEL SECURITY;

-- Staff and navigator can read/write; members cannot see arc internals
CREATE POLICY "staff_manage_birthday_arc_state"
  ON birthday_arc_state
  FOR ALL
  TO authenticated
  USING (is_staff() OR is_navigator())
  WITH CHECK (is_staff() OR is_navigator());

-- 3. Index for efficient cron queries
CREATE INDEX IF NOT EXISTS idx_birthday_arc_state_member_year
  ON birthday_arc_state (member_id, arc_year);

-- 4. Trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION touch_birthday_arc_state()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_birthday_arc_state_updated_at ON birthday_arc_state;
CREATE TRIGGER trg_birthday_arc_state_updated_at
  BEFORE UPDATE ON birthday_arc_state
  FOR EACH ROW EXECUTE FUNCTION touch_birthday_arc_state();
