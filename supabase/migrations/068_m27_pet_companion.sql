-- M27 — Pet & Companion Life Tracking (Phases 117–119)
-- Phase 117  Pet profiles in the member record + proactive pet birthday / adoption-anniversary acknowledgment
-- Phase 118  Pet milestone celebrations alongside human milestones (reuses celebration_events)
-- Phase 119  Pet loss circle — a peer circle DISTINCT from the human bereavement circles
--
-- Run this whole file once in the Supabase SQL Editor. Safe to re-run (guards throughout).
-- No external service. Aria's pet-date acknowledgment is a [STUB][Aria] log in the cron;
-- the care-team pet-loss notice is a [STUB][EMAIL] log. Pet photos use a new private
-- Storage bucket "member-pet-photos" (create it in Supabase Storage — see WHAT TO CREATE below).

-- ═══════════════ PHASE 117 — Pet profiles ═══════════════

CREATE TABLE IF NOT EXISTS member_pets (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at        timestamptz DEFAULT now() NOT NULL,
  member_id         uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  added_by          uuid REFERENCES family_members(id) ON DELETE SET NULL,
  name              text NOT NULL,
  species           text NOT NULL DEFAULT 'dog',   -- dog | cat | bird | rabbit | fish | horse | other
  breed             text,
  birth_date        date,                          -- nullable — many adopted pets have an estimated birthday
  adoption_date     date,                          -- "gotcha day"
  color_markings    text,
  notes             text,
  photo_path        text,
  is_active         boolean NOT NULL DEFAULT true,
  passed_away_on    date,                          -- set when the companion has died
  memorial_note     text
);
ALTER TABLE member_pets ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "family_all_own_member_pets" ON member_pets FOR ALL
    USING (EXISTS (SELECT 1 FROM family_members fm
      WHERE fm.member_id = member_pets.member_id AND fm.supabase_auth_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "navigator_reads_member_pets" ON member_pets FOR SELECT
    USING (EXISTS (SELECT 1 FROM care_navigators cn WHERE cn.supabase_auth_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS idx_member_pets_member ON member_pets(member_id);
CREATE INDEX IF NOT EXISTS idx_member_pets_active ON member_pets(is_active);

-- ═══════════════ PHASE 118 — Pet milestones reuse celebration_events ═══════════════
-- Pet celebrations live in the existing celebration_events table alongside human ones so
-- /dashboard/celebrations and the dashboard "Celebrations" section show both. Two optional
-- columns tie a celebration row to a specific pet.

ALTER TABLE celebration_events ADD COLUMN IF NOT EXISTS pet_id   uuid REFERENCES member_pets(id) ON DELETE CASCADE;
ALTER TABLE celebration_events ADD COLUMN IF NOT EXISTS pet_name text;
CREATE INDEX IF NOT EXISTS idx_celebration_events_pet ON celebration_events(pet_id);

-- New celebration_type values used by the pet-milestones cron (celebration_type is free text):
--   pet_birthday                — the pet's birthday is within the reminder window
--   pet_adoption_anniversary    — the "gotcha day" is within the reminder window
--   pet_senior_milestone        — a dog/cat has reached ~10 years (one-time, per pet)

-- ═══════════════ PHASE 119 — Pet loss circle (distinct from human bereavement) ═══════════════
-- A single implicit global peer circle. There is no circle_id — membership in this table IS
-- membership in "The Companion Circle". It is deliberately separate from grief_support_requests
-- and the cultural / grief circles: pet loss has its own space, language, and resources.

CREATE TABLE IF NOT EXISTS pet_loss_circle_members (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at    timestamptz DEFAULT now() NOT NULL,
  member_id     uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE UNIQUE,
  display_name  text NOT NULL,                    -- first name + last initial, member-editable
  pet_remembered text,                            -- optional: "in memory of Biscuit"
  is_active     boolean NOT NULL DEFAULT true,
  joined_at     timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE pet_loss_circle_members ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "family_all_own_pet_loss_membership" ON pet_loss_circle_members FOR ALL
    USING (EXISTS (SELECT 1 FROM family_members fm
      WHERE fm.member_id = pet_loss_circle_members.member_id AND fm.supabase_auth_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  -- Circle members can see who else is in the circle (roster is small + supportive).
  CREATE POLICY "circle_members_read_roster" ON pet_loss_circle_members FOR SELECT
    USING (EXISTS (SELECT 1 FROM pet_loss_circle_members mine
      JOIN family_members fm ON fm.member_id = mine.member_id
      WHERE fm.supabase_auth_id = auth.uid() AND mine.is_active = true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "navigator_reads_pet_loss_membership" ON pet_loss_circle_members FOR SELECT
    USING (EXISTS (SELECT 1 FROM care_navigators cn WHERE cn.supabase_auth_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS pet_loss_circle_posts (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at   timestamptz DEFAULT now() NOT NULL,
  member_id    uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  author_name  text NOT NULL,
  content      text NOT NULL,
  post_type    text NOT NULL DEFAULT 'reflection'  -- reflection | tribute | question | encouragement
);
ALTER TABLE pet_loss_circle_posts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  -- Any active circle member can read the feed.
  CREATE POLICY "circle_members_read_feed" ON pet_loss_circle_posts FOR SELECT
    USING (EXISTS (SELECT 1 FROM pet_loss_circle_members mine
      JOIN family_members fm ON fm.member_id = mine.member_id
      WHERE fm.supabase_auth_id = auth.uid() AND mine.is_active = true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  -- A member may write / edit / delete only their own posts.
  CREATE POLICY "member_writes_own_pet_loss_posts" ON pet_loss_circle_posts FOR ALL
    USING (EXISTS (SELECT 1 FROM family_members fm
      WHERE fm.member_id = pet_loss_circle_posts.member_id AND fm.supabase_auth_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "navigator_reads_pet_loss_posts" ON pet_loss_circle_posts FOR SELECT
    USING (EXISTS (SELECT 1 FROM care_navigators cn WHERE cn.supabase_auth_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS idx_pet_loss_posts_created ON pet_loss_circle_posts(created_at DESC);

CREATE TABLE IF NOT EXISTS pet_loss_support_requests (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at       timestamptz DEFAULT now() NOT NULL,
  member_id        uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  pet_id           uuid REFERENCES member_pets(id) ON DELETE SET NULL,
  pet_name         text,
  loss_date        date,
  support_type     text NOT NULL DEFAULT 'one_to_one',  -- one_to_one | circle_only | resources_only
  message          text,
  status           text NOT NULL DEFAULT 'pending',     -- pending | acknowledged | supported | closed
  navigator_notes  text,
  navigator_task_id uuid REFERENCES navigator_tasks(id) ON DELETE SET NULL,
  matched_at       timestamptz
);
ALTER TABLE pet_loss_support_requests ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "family_all_own_pet_loss_requests" ON pet_loss_support_requests FOR ALL
    USING (EXISTS (SELECT 1 FROM family_members fm
      WHERE fm.member_id = pet_loss_support_requests.member_id AND fm.supabase_auth_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "navigator_rw_pet_loss_requests" ON pet_loss_support_requests FOR ALL
    USING (EXISTS (SELECT 1 FROM care_navigators cn WHERE cn.supabase_auth_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS idx_pet_loss_requests_member ON pet_loss_support_requests(member_id);
CREATE INDEX IF NOT EXISTS idx_pet_loss_requests_status ON pet_loss_support_requests(status);

-- ═══════════════════════════════════════════════════════════════════════════
-- WHAT TO CREATE MANUALLY AFTER RUNNING THIS FILE:
--   Supabase Storage → New bucket → Name: member-pet-photos → Private → Create
--   (Only needed for pet photo uploads; every pet profile works without a photo.)
-- ═══════════════════════════════════════════════════════════════════════════
