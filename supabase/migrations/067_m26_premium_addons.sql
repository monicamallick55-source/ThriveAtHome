-- M26 — Premium Subscription Add-Ons (Phases 108–116)
-- Phase 108  Add-Ons catalog + purchase ledger + Caregiver Family Plan ($89/mo)
-- Phase 109  Long-Distance Caregiver Add-on ($19/mo) + caregiver video diary
-- Phase 110  Skill Exchange Premium ($9/mo — priority matching)
-- Phase 111  Cultural Circle Premium ($5/mo)
-- Phase 112  Volunteer Concierge ($19/mo — premium matching)
-- Phase 113  Annual Care Planning Session ($149/session)
-- Phase 114  Benefits Maximizer Deep-Dive ($79 one-time)
-- Phase 115  Milestone Birthday Memory Book ($49 one-time — 70th / 75th / 80th)
-- Phase 116  Extra annual legal consultation ($75/consultation)
--
-- Run this whole file once in the Supabase SQL Editor. Safe to re-run (guards throughout).
-- Real payment collection is still stubbed (StubBillingProvider) — every purchase logs
-- "[STUB][Billing] ..." and records a member_addons row. Stripe wiring is a later phase.

-- ═══════════════════════════════ ENUMS ═══════════════════════════════
DO $$ BEGIN
  CREATE TYPE addon_billing AS ENUM ('monthly','one_time');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE addon_purchase_status AS ENUM ('active','pending','fulfilled','cancelled','expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ═══════════════ PHASE 108 — Catalog + purchase ledger ═══════════════

CREATE TABLE IF NOT EXISTS premium_addons (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at        timestamptz DEFAULT now() NOT NULL,
  addon_key         text NOT NULL UNIQUE,
  name              text NOT NULL,
  tagline           text,
  description       text NOT NULL,
  billing           addon_billing NOT NULL DEFAULT 'monthly',
  price_cents       int NOT NULL,
  min_plan_tier     text,                       -- null = any plan; else 'connect' | 'complete' | 'premier'
  fulfillment       text NOT NULL DEFAULT 'feature',  -- feature | navigator_task | goods | scheduled_call
  benefits          text[] NOT NULL DEFAULT '{}',
  family_seat_bonus int NOT NULL DEFAULT 0,     -- extra family dashboard seats this add-on grants
  is_active         boolean NOT NULL DEFAULT true,
  sort_order        int NOT NULL DEFAULT 100
);
ALTER TABLE premium_addons ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "anyone_reads_active_addons" ON premium_addons
    FOR SELECT USING (is_active = true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS member_addons (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at        timestamptz DEFAULT now() NOT NULL,
  member_id         uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  addon_id          uuid NOT NULL REFERENCES premium_addons(id) ON DELETE CASCADE,
  addon_key         text NOT NULL,
  billing           addon_billing NOT NULL DEFAULT 'monthly',
  price_cents       int NOT NULL,
  status            addon_purchase_status NOT NULL DEFAULT 'active',
  purchased_by      uuid REFERENCES family_members(id) ON DELETE SET NULL,
  stripe_subscription_id text,
  started_at        timestamptz NOT NULL DEFAULT now(),
  renews_at         timestamptz,
  cancelled_at      timestamptz,
  fulfilled_at      timestamptz,
  navigator_task_id uuid REFERENCES navigator_tasks(id) ON DELETE SET NULL,
  note              text,
  metadata          jsonb NOT NULL DEFAULT '{}'
);
ALTER TABLE member_addons ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "family_all_own_member_addons" ON member_addons FOR ALL
    USING (EXISTS (SELECT 1 FROM family_members fm
      WHERE fm.member_id = member_addons.member_id AND fm.supabase_auth_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "navigator_reads_member_addons" ON member_addons FOR SELECT
    USING (EXISTS (SELECT 1 FROM care_navigators cn WHERE cn.supabase_auth_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS idx_member_addons_member ON member_addons(member_id);
CREATE INDEX IF NOT EXISTS idx_member_addons_key    ON member_addons(addon_key);
CREATE INDEX IF NOT EXISTS idx_member_addons_status ON member_addons(status);

-- ═══════════════ PHASE 109 — Caregiver video diary ═══════════════

CREATE TABLE IF NOT EXISTS caregiver_video_diary_entries (
  id                     uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at             timestamptz DEFAULT now() NOT NULL,
  member_id              uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  author_family_member_id uuid REFERENCES family_members(id) ON DELETE SET NULL,
  title                  text NOT NULL,
  note                   text,
  video_path             text,
  visibility             text NOT NULL DEFAULT 'family'   -- family | member_too
);
ALTER TABLE caregiver_video_diary_entries ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "family_all_own_video_diary" ON caregiver_video_diary_entries FOR ALL
    USING (EXISTS (SELECT 1 FROM family_members fm
      WHERE fm.member_id = caregiver_video_diary_entries.member_id AND fm.supabase_auth_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS idx_video_diary_member ON caregiver_video_diary_entries(member_id);

-- ═══════════════ PHASE 113 — Annual Care Planning Session ═══════════════

CREATE TABLE IF NOT EXISTS care_planning_sessions (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at        timestamptz DEFAULT now() NOT NULL,
  member_id         uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  member_addon_id   uuid REFERENCES member_addons(id) ON DELETE SET NULL,
  requested_by      uuid REFERENCES family_members(id) ON DELETE SET NULL,
  status            text NOT NULL DEFAULT 'requested',  -- requested | scheduled | completed | cancelled
  focus_areas       text[] NOT NULL DEFAULT '{}',
  preferred_times   text,
  scheduled_for     timestamptz,
  navigator_id      uuid REFERENCES care_navigators(id) ON DELETE SET NULL,
  navigator_task_id uuid REFERENCES navigator_tasks(id) ON DELETE SET NULL,
  summary_note      text,
  summary_doc_path  text
);
ALTER TABLE care_planning_sessions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "family_all_own_care_planning" ON care_planning_sessions FOR ALL
    USING (EXISTS (SELECT 1 FROM family_members fm
      WHERE fm.member_id = care_planning_sessions.member_id AND fm.supabase_auth_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "navigator_rw_care_planning" ON care_planning_sessions FOR ALL
    USING (EXISTS (SELECT 1 FROM care_navigators cn WHERE cn.supabase_auth_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS idx_care_planning_member ON care_planning_sessions(member_id);

-- ═══════════════ PHASE 114 — Benefits Maximizer Deep-Dive ═══════════════

CREATE TABLE IF NOT EXISTS benefits_deep_dives (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at        timestamptz DEFAULT now() NOT NULL,
  member_id         uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  member_addon_id   uuid REFERENCES member_addons(id) ON DELETE SET NULL,
  requested_by      uuid REFERENCES family_members(id) ON DELETE SET NULL,
  household         jsonb NOT NULL DEFAULT '{}',       -- income band, household size, veteran, homeowner, etc.
  status            text NOT NULL DEFAULT 'requested', -- requested | in_review | completed | cancelled
  navigator_id      uuid REFERENCES care_navigators(id) ON DELETE SET NULL,
  navigator_task_id uuid REFERENCES navigator_tasks(id) ON DELETE SET NULL,
  findings_note     text,
  findings_doc_path text,
  estimated_annual_value_cents int
);
ALTER TABLE benefits_deep_dives ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "family_all_own_benefits_deep_dive" ON benefits_deep_dives FOR ALL
    USING (EXISTS (SELECT 1 FROM family_members fm
      WHERE fm.member_id = benefits_deep_dives.member_id AND fm.supabase_auth_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "navigator_rw_benefits_deep_dive" ON benefits_deep_dives FOR ALL
    USING (EXISTS (SELECT 1 FROM care_navigators cn WHERE cn.supabase_auth_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS idx_benefits_deep_dive_member ON benefits_deep_dives(member_id);

-- ═══════════════ PHASE 115 — Milestone Birthday Memory Book ═══════════════

CREATE TABLE IF NOT EXISTS memory_book_orders (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at        timestamptz DEFAULT now() NOT NULL,
  member_id         uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  member_addon_id   uuid REFERENCES member_addons(id) ON DELETE SET NULL,
  ordered_by        uuid REFERENCES family_members(id) ON DELETE SET NULL,
  milestone_age     int NOT NULL CHECK (milestone_age IN (70,75,80)),
  status            text NOT NULL DEFAULT 'requested',  -- requested | collecting_photos | in_production | shipped | delivered | cancelled
  recipient_name    text,
  recipient_address text,
  dedication_text   text,
  photo_paths       text[] NOT NULL DEFAULT '{}',
  goods_order_ref   text,
  tracking_note     text,
  navigator_task_id uuid REFERENCES navigator_tasks(id) ON DELETE SET NULL
);
ALTER TABLE memory_book_orders ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "family_all_own_memory_book" ON memory_book_orders FOR ALL
    USING (EXISTS (SELECT 1 FROM family_members fm
      WHERE fm.member_id = memory_book_orders.member_id AND fm.supabase_auth_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "navigator_reads_memory_book" ON memory_book_orders FOR SELECT
    USING (EXISTS (SELECT 1 FROM care_navigators cn WHERE cn.supabase_auth_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS idx_memory_book_member ON memory_book_orders(member_id);

-- ═══════════════ PHASE 116 — Extra annual legal consultation ═══════════════

CREATE TABLE IF NOT EXISTS legal_consultations (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at        timestamptz DEFAULT now() NOT NULL,
  member_id         uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  member_addon_id   uuid REFERENCES member_addons(id) ON DELETE SET NULL,
  requested_by      uuid REFERENCES family_members(id) ON DELETE SET NULL,
  advisor_id        uuid REFERENCES trusted_advisors(id) ON DELETE SET NULL,
  topic             text,
  status            text NOT NULL DEFAULT 'requested',  -- requested | scheduled | completed | cancelled
  scheduled_for     timestamptz,
  navigator_id      uuid REFERENCES care_navigators(id) ON DELETE SET NULL,
  navigator_task_id uuid REFERENCES navigator_tasks(id) ON DELETE SET NULL,
  notes             text
);
ALTER TABLE legal_consultations ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "family_all_own_legal_consult" ON legal_consultations FOR ALL
    USING (EXISTS (SELECT 1 FROM family_members fm
      WHERE fm.member_id = legal_consultations.member_id AND fm.supabase_auth_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "navigator_rw_legal_consult" ON legal_consultations FOR ALL
    USING (EXISTS (SELECT 1 FROM care_navigators cn WHERE cn.supabase_auth_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS idx_legal_consult_member ON legal_consultations(member_id);

-- ═══════════════════════════ SEED — the 9 add-ons ═══════════════════════════

INSERT INTO premium_addons
  (addon_key, name, tagline, billing, price_cents, min_plan_tier, fulfillment, family_seat_bonus, sort_order, benefits, description)
SELECT * FROM (VALUES
  ('caregiver_family_plan',
   'Caregiver Family Plan', 'One senior, the whole family, one coordinator call a month',
   'monthly'::addon_billing, 8900, NULL, 'scheduled_call', 3, 10,
   ARRAY[
     'Up to 5 family dashboard seats (3 more than your base plan)',
     'A monthly 30-minute coordinator call with your Navigator',
     'Shared family task list and care calendar',
     'One consolidated monthly care summary for the whole family'
   ],
   'Designed for families sharing the care of one older adult. Adds extra dashboard seats so siblings and adult children each have their own login, and schedules a standing monthly coordinator call with your Navigator to keep everyone aligned.'),

  ('long_distance_caregiver',
   'Long-Distance Caregiver Add-on', 'Extra reassurance when you live far away',
   'monthly'::addon_billing, 1900, NULL, 'feature', 0, 20,
   ARRAY[
     'Enhanced alerts — get notified sooner, with more detail',
     'Priority task management and follow-up tracking',
     'A private family video diary to leave short messages',
     'Weekly "here is how the week went" recap'
   ],
   'For adult children and relatives supporting a parent from another city or state. Turns up the sensitivity on alerts, keeps a running task list, and adds a private video diary so you can record a short hello your parent''s Navigator can play back.'),

  ('skill_exchange_premium',
   'Skill Exchange Premium', 'Get matched first',
   'monthly'::addon_billing, 900, NULL, 'feature', 0, 30,
   ARRAY[
     'Priority matching in the Skill Exchange',
     'Front-of-queue when a new teacher or learner joins',
     'Up to 3 active exchanges at once (standard is 1)'
   ],
   'Moves you to the front of the Skill Exchange matching queue and lets you run several exchanges at the same time.'),

  ('cultural_circle_premium',
   'Cultural Circle Premium', 'A little extra in your community circle',
   'monthly'::addon_billing, 500, NULL, 'feature', 0, 40,
   ARRAY[
     'Priority RSVP for popular circle events and classes',
     'Early access to festival calendars and potluck sign-ups',
     'A free materials kit for one cultural craft class each quarter'
   ],
   'Small perks for members who live in their Cultural Community Circle — priority RSVPs, early festival calendars, and a quarterly craft kit on us.'),

  ('volunteer_concierge',
   'Volunteer Concierge', 'A hand-picked volunteer match',
   'monthly'::addon_billing, 1900, NULL, 'feature', 0, 50,
   ARRAY[
     'Premium volunteer matching — a coordinator reviews every match by hand',
     'Faster turnaround on a new volunteer request',
     'Re-matching within 48 hours if the first fit isn''t right'
   ],
   'Instead of the automated match, a ThriveAtHome coordinator personally reviews the caseload and hand-picks a volunteer, then checks in after the first visit.'),

  ('annual_care_planning',
   'Annual Care Planning Session', 'A yearly sit-down with your Navigator',
   'one_time'::addon_billing, 14900, NULL, 'navigator_task', 0, 60,
   ARRAY[
     'A 60-minute planning call with your Navigator',
     'A written care plan covering health, home, money, and support',
     'Clear next steps and who is responsible for each',
     'A follow-up check-in 30 days later'
   ],
   'A focused yearly conversation to step back and look at the whole picture — what''s working, what''s changed, and what to line up for the year ahead. You get a written plan afterward.'),

  ('benefits_maximizer_deep_dive',
   'Benefits Maximizer Deep-Dive', 'Find every dollar you''re entitled to',
   'one_time'::addon_billing, 7900, NULL, 'navigator_task', 0, 70,
   ARRAY[
     'A full review of federal, state, and local benefits',
     'Medicare Savings Programs, SNAP, LIHEAP, property-tax relief, VA benefits and more',
     'A written summary with estimated annual value and how to apply',
     'A Navigator walks you through the top 3 applications'
   ],
   'Goes well beyond the quick Benefits Finder. A Navigator reviews the full household picture and hands back a written report of everything the member likely qualifies for, ranked by dollar value.'),

  ('milestone_birthday_memory_book',
   'Milestone Birthday Memory Book', 'A printed keepsake for a 70th, 75th, or 80th',
   'one_time'::addon_billing, 4900, NULL, 'goods', 0, 80,
   ARRAY[
     'A professionally printed hardcover memory book',
     'Family uploads photos and notes; we design and print it',
     'Delivered in time for the milestone birthday',
     'Available for 70th, 75th, and 80th birthdays'
   ],
   'For a 70th, 75th, or 80th birthday. The family uploads favourite photos and short notes, ThriveAtHome lays it out and prints a hardcover book, and it ships to arrive before the day.'),

  ('extra_legal_consultation',
   'Extra Legal Consultation', 'One more session with a vetted attorney',
   'one_time'::addon_billing, 7500, NULL, 'navigator_task', 0, 90,
   ARRAY[
     'A 45-minute consultation with a Trusted Advisor attorney',
     'Wills, powers of attorney, advance directives, or a specific question',
     'Your Navigator arranges the introduction and shares any documents',
     'A short written recap of what was discussed'
   ],
   'Beyond the consultation included with some plans — books one additional session with an elder-law or estate-planning attorney from the Trusted Advisor Directory.')
) AS v(addon_key, name, tagline, billing, price_cents, min_plan_tier, fulfillment, family_seat_bonus, sort_order, benefits, description)
WHERE NOT EXISTS (SELECT 1 FROM premium_addons p WHERE p.addon_key = v.addon_key);
