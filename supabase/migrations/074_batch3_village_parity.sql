-- Migration 074: Helpful Village feature-parity P2 (Batch 3)
-- Run once in the Supabase SQL Editor. Safe to re-run.
--   1. event_waitlist            — waitlist for full events, auto-notified on open spot
--   2. recurring_service_schedules — org admin sets weekly / bi-weekly recurring bookings
--   3. volunteer_shifts          — volunteers publish weekly availability; org sees gaps
--   4. members.directory_opt_in  — opt-in searchable member directory within a village

-- ─── 1. Event waitlist ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_waitlist (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at  timestamptz DEFAULT now() NOT NULL,
  event_id    uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  member_id   uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  status      text NOT NULL DEFAULT 'waiting',   -- waiting | offered | promoted | expired
  notified_at timestamptz,
  UNIQUE (event_id, member_id)
);
ALTER TABLE event_waitlist ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "family_own_event_waitlist" ON event_waitlist FOR ALL
    USING (EXISTS (SELECT 1 FROM family_members fm
      WHERE fm.supabase_auth_id = auth.uid() AND fm.member_id = event_waitlist.member_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "staff_read_event_waitlist" ON event_waitlist FOR SELECT
    USING (EXISTS (SELECT 1 FROM family_members fm
      WHERE fm.supabase_auth_id = auth.uid() AND fm.role IN ('navigator','admin','org_admin')));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS idx_event_waitlist_event ON event_waitlist(event_id, created_at);

-- ─── 2. Recurring service schedules ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS recurring_service_schedules (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at     timestamptz DEFAULT now() NOT NULL,
  org_id         uuid REFERENCES community_orgs(id) ON DELETE CASCADE,
  member_id      uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  created_by     uuid REFERENCES family_members(id) ON DELETE SET NULL,
  service_type   text NOT NULL,
  cadence        text NOT NULL DEFAULT 'weekly',   -- weekly | biweekly
  day_of_week    int NOT NULL DEFAULT 1,           -- 0=Sun .. 6=Sat
  time_of_day    text,                             -- 'HH:MM'
  notes          text,
  next_run_date  date NOT NULL,
  is_active      boolean NOT NULL DEFAULT true,
  last_generated_at timestamptz
);
ALTER TABLE recurring_service_schedules ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "org_admin_recurring_schedules" ON recurring_service_schedules FOR ALL
    USING (EXISTS (SELECT 1 FROM family_members fm
      WHERE fm.supabase_auth_id = auth.uid()
      AND (fm.role = 'admin' OR fm.org_id = recurring_service_schedules.org_id)));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "family_read_own_recurring_schedules" ON recurring_service_schedules FOR SELECT
    USING (EXISTS (SELECT 1 FROM family_members fm
      WHERE fm.supabase_auth_id = auth.uid() AND fm.member_id = recurring_service_schedules.member_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS idx_recurring_schedules_due ON recurring_service_schedules(next_run_date) WHERE is_active;

-- ─── 3. Volunteer weekly availability shifts ──────────────────────────────
CREATE TABLE IF NOT EXISTS volunteer_shifts (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at   timestamptz DEFAULT now() NOT NULL,
  volunteer_id uuid NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,
  day_of_week  int NOT NULL,                       -- 0=Sun .. 6=Sat
  start_time   text NOT NULL,                      -- 'HH:MM'
  end_time     text NOT NULL,
  UNIQUE (volunteer_id, day_of_week, start_time, end_time)
);
ALTER TABLE volunteer_shifts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "volunteer_own_shifts" ON volunteer_shifts FOR ALL
    USING (EXISTS (SELECT 1 FROM volunteers v
      WHERE v.id = volunteer_shifts.volunteer_id AND v.supabase_auth_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "staff_read_volunteer_shifts" ON volunteer_shifts FOR SELECT
    USING (EXISTS (SELECT 1 FROM family_members fm
      WHERE fm.supabase_auth_id = auth.uid() AND fm.role IN ('navigator','admin','org_admin')));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS idx_volunteer_shifts_vol ON volunteer_shifts(volunteer_id);

-- ─── 4. Opt-in member directory ──────────────────────────────────────────
ALTER TABLE members ADD COLUMN IF NOT EXISTS directory_opt_in boolean NOT NULL DEFAULT false;
ALTER TABLE members ADD COLUMN IF NOT EXISTS directory_bio text;
