-- Migration 096: G4 Village Parity & Platform
-- Covers: G4.1 HV importer, G4.3 geocoding, G4.4 grief circles,
--         G4.5 device kiosk, G4.6 transport tiers, G4.7 volunteer training,
--         G4.8 language line
-- Apply after 095_sprint2_gifts_celebrations_community.sql

-- ─── G4.1 Helpful Village migration importer ─────────────────────────────────

CREATE TABLE IF NOT EXISTS org_import_jobs (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at      timestamptz DEFAULT now() NOT NULL,
  org_id          uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  created_by      uuid NOT NULL,                -- staff user_id
  source          text NOT NULL DEFAULT 'helpful_village'
                  CHECK (source IN ('helpful_village','csv_generic')),
  status          text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','mapping','dry_run','running','complete','failed','cancelled')),
  filename        text NOT NULL,
  storage_path    text,                         -- Supabase Storage path to uploaded CSV
  column_mapping  jsonb NOT NULL DEFAULT '{}',  -- { csv_col: thrive_field }
  dry_run_result  jsonb,                        -- { valid_count, error_count, errors[] }
  import_result   jsonb,                        -- { imported, skipped, errors[] }
  row_count       integer,
  error_message   text,
  started_at      timestamptz,
  completed_at    timestamptz,
  hv_sync_enabled boolean NOT NULL DEFAULT false,
  hv_last_sync_at timestamptz
);
ALTER TABLE org_import_jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "oij_staff_only" ON org_import_jobs;
CREATE POLICY "oij_staff_only" ON org_import_jobs FOR ALL USING (is_staff());

CREATE INDEX IF NOT EXISTS idx_oij_org ON org_import_jobs(org_id, created_at DESC);

-- ─── G4.3 Geocoding — lat/lng on members and volunteers ──────────────────────

ALTER TABLE members    ADD COLUMN IF NOT EXISTS lat numeric(9,6);
ALTER TABLE members    ADD COLUMN IF NOT EXISTS lng numeric(9,6);
ALTER TABLE members    ADD COLUMN IF NOT EXISTS geocoded_at timestamptz;

ALTER TABLE volunteers ADD COLUMN IF NOT EXISTS lat numeric(9,6);
ALTER TABLE volunteers ADD COLUMN IF NOT EXISTS lng numeric(9,6);
ALTER TABLE volunteers ADD COLUMN IF NOT EXISTS geocoded_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_members_geo    ON members(lat, lng)    WHERE lat IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_volunteers_geo ON volunteers(lat, lng) WHERE lat IS NOT NULL;

-- ─── G4.4 Grief circles ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS grief_circles (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at      timestamptz DEFAULT now() NOT NULL,
  org_id          uuid REFERENCES orgs(id) ON DELETE SET NULL,
  name            text NOT NULL,
  description     text,
  facilitator_id  uuid,                         -- navigator user_id
  loss_type       text NOT NULL DEFAULT 'general'
                  CHECK (loss_type IN ('spouse','parent','child','sibling','friend','pet','general')),
  format          text NOT NULL DEFAULT 'virtual'
                  CHECK (format IN ('virtual','in_person','hybrid')),
  schedule_text   text,                         -- human-readable, e.g. "Every Tuesday 2pm PT"
  max_members     integer NOT NULL DEFAULT 8,
  status          text NOT NULL DEFAULT 'forming'
                  CHECK (status IN ('forming','active','paused','closed')),
  is_private      boolean NOT NULL DEFAULT true,  -- navigator-invite only
  next_session_at timestamptz
);
ALTER TABLE grief_circles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "gc_member_or_staff" ON grief_circles;
CREATE POLICY "gc_member_or_staff" ON grief_circles FOR SELECT
  USING (
    is_staff()
    OR id IN (
      SELECT circle_id FROM grief_circle_members
      WHERE member_id = ANY(acting_member_ids()) AND status = 'active'
    )
  );
DROP POLICY IF EXISTS "gc_staff_write" ON grief_circles;
CREATE POLICY "gc_staff_write" ON grief_circles FOR ALL USING (is_staff());

CREATE TABLE IF NOT EXISTS grief_circle_members (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at  timestamptz DEFAULT now() NOT NULL,
  circle_id   uuid NOT NULL REFERENCES grief_circles(id) ON DELETE CASCADE,
  member_id   uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  invited_by  uuid NOT NULL,                    -- navigator user_id
  status      text NOT NULL DEFAULT 'invited'
              CHECK (status IN ('invited','active','paused','left')),
  joined_at   timestamptz,
  left_at     timestamptz,
  UNIQUE(circle_id, member_id)
);
ALTER TABLE grief_circle_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "gcm_own_or_staff" ON grief_circle_members;
CREATE POLICY "gcm_own_or_staff" ON grief_circle_members FOR ALL
  USING (member_id = ANY(acting_member_ids()) OR is_staff())
  WITH CHECK (is_staff());

CREATE INDEX IF NOT EXISTS idx_gcm_circle  ON grief_circle_members(circle_id);
CREATE INDEX IF NOT EXISTS idx_gcm_member  ON grief_circle_members(member_id);

-- ─── G4.5 Thrive Device kiosk ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS device_tokens (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at      timestamptz DEFAULT now() NOT NULL,
  token           text NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  member_id       uuid REFERENCES members(id) ON DELETE SET NULL,
  org_id          uuid REFERENCES orgs(id) ON DELETE SET NULL,
  label           text,                         -- e.g. "Living Room Tablet"
  device_type     text NOT NULL DEFAULT 'tablet'
                  CHECK (device_type IN ('tablet','kiosk','phone')),
  os              text,                         -- 'ios' | 'android' | 'chromeos'
  mdm_device_id   text,                         -- stub for future MDM integration
  status          text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','active','suspended','retired')),
  last_seen_at    timestamptz,
  last_seen_ip    text,
  activated_at    timestamptz,
  activated_by    uuid                          -- staff user_id
);
ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "dt_staff_only" ON device_tokens;
CREATE POLICY "dt_staff_only" ON device_tokens FOR ALL USING (is_staff());
DROP POLICY IF EXISTS "dt_own_device" ON device_tokens;
CREATE POLICY "dt_own_device" ON device_tokens FOR SELECT
  USING (member_id = ANY(acting_member_ids()));

CREATE INDEX IF NOT EXISTS idx_dt_member ON device_tokens(member_id) WHERE member_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_dt_token  ON device_tokens(token);

-- ─── G4.6 Transport dispatch tiers ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS transport_requests (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at        timestamptz DEFAULT now() NOT NULL,
  member_id         uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  pickup_address    text NOT NULL,
  dropoff_address   text NOT NULL,
  pickup_at         timestamptz NOT NULL,
  purpose           text,
  wheelchair_needed boolean NOT NULL DEFAULT false,
  status            text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','volunteer_dispatched','lyft_dispatched','av_dispatched','completed','cancelled','failed')),
  tier_used         text CHECK (tier_used IN ('volunteer','lyft','av')),
  volunteer_id      uuid REFERENCES volunteers(id),
  external_booking_id text,                     -- Lyft / AV provider booking ref
  external_provider text,                       -- 'lyft' | 'waymo' | 'other'
  cost_cents        integer,
  navigator_task_id uuid REFERENCES navigator_tasks(id),
  notes             text
);
ALTER TABLE transport_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tr_own_or_staff" ON transport_requests;
CREATE POLICY "tr_own_or_staff" ON transport_requests FOR ALL
  USING (member_id = ANY(acting_member_ids()) OR is_staff())
  WITH CHECK (member_id = ANY(acting_member_ids()) OR is_staff());

CREATE INDEX IF NOT EXISTS idx_tr_member ON transport_requests(member_id, pickup_at DESC);

-- ─── G4.7 Volunteer training modules ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS volunteer_training_modules (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at   timestamptz DEFAULT now() NOT NULL,
  slug         text NOT NULL UNIQUE,
  title        text NOT NULL,
  description  text,
  content_url  text,                            -- link to video / doc
  duration_min integer NOT NULL DEFAULT 15,
  required     boolean NOT NULL DEFAULT true,
  sort_order   integer NOT NULL DEFAULT 0,
  active       boolean NOT NULL DEFAULT true
);

-- Seed the 5 required modules
INSERT INTO volunteer_training_modules (slug, title, description, duration_min, required, sort_order) VALUES
  ('orientation',          'Volunteer Orientation',
   'Welcome to ThriveAtHome. Learn our mission, values, and how volunteers support senior independence.',
   20, true, 1),
  ('privacy_and_safety',   'Privacy & Safety',
   'Confidentiality requirements, mandatory reporting basics, and what to do in an emergency.',
   15, true, 2),
  ('companion_calls',      'Companion Call Best Practices',
   'How to run a warm, effective companion call. Active listening, conversation starters, and when to loop in a navigator.',
   15, true, 3),
  ('boundaries',           'Healthy Boundaries',
   'Understanding professional boundaries with members and their families.',
   10, true, 4),
  ('dementia_awareness',   'Dementia Awareness 101',
   'Recognizing signs of cognitive change, communication tips, and how to support members with memory concerns.',
   20, true, 5)
ON CONFLICT (slug) DO NOTHING;

CREATE TABLE IF NOT EXISTS volunteer_training_completions (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at   timestamptz DEFAULT now() NOT NULL,
  volunteer_id uuid NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,
  module_id    uuid NOT NULL REFERENCES volunteer_training_modules(id),
  completed_at timestamptz NOT NULL DEFAULT now(),
  score        integer,                         -- quiz score 0-100 if applicable
  passed       boolean NOT NULL DEFAULT true,
  UNIQUE(volunteer_id, module_id)
);
ALTER TABLE volunteer_training_completions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "vtc_own_or_staff" ON volunteer_training_completions;
CREATE POLICY "vtc_own_or_staff" ON volunteer_training_completions FOR ALL
  USING (
    volunteer_id IN (
      SELECT id FROM volunteers WHERE supabase_auth_id = auth.uid()
    ) OR is_staff()
  )
  WITH CHECK (
    volunteer_id IN (
      SELECT id FROM volunteers WHERE supabase_auth_id = auth.uid()
    ) OR is_staff()
  );

CREATE INDEX IF NOT EXISTS idx_vtc_volunteer ON volunteer_training_completions(volunteer_id);

-- ─── G4.8 Language Line — no schema change needed ────────────────────────────
-- interpreter_needed flag lives in Retell dynamic variables (call metadata).
-- The transfer_to_interpreter tool is a Retell tool stub (see lib/retell/tools/).
-- No new tables required.
