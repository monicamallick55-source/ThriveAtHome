-- Sprint 2 migration: Gifts, Celebrations depth, Community partners, Home sharing,
--                      Achievements, Transition plans, Pets, Opportunities, Campaigns
-- Apply after 094_metro_areas.sql

-- ─── G7.3 Gifts catalog & orders ────────────────────────────────────────────

-- gift_orders already exists (migration 112 from G7.2 tarball).
-- If the table exists skip; otherwise create here.
CREATE TABLE IF NOT EXISTS gift_orders (
  id                   uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at           timestamptz DEFAULT now() NOT NULL,
  from_member_id       uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  to_family_member_id  uuid NOT NULL REFERENCES family_members(id),
  catalog_item_id      text NOT NULL,          -- slug from lib/gifts/catalog.ts
  kind                 text NOT NULL CHECK (kind IN ('note','card','flowers','food_basket','gift_card','experience','other')),
  title                text NOT NULL,
  price_cents          integer NOT NULL DEFAULT 0,
  quantity             integer NOT NULL DEFAULT 1,
  personalization      text,                   -- member's personal message
  stripe_payment_intent text,
  stripe_session_id    text,
  status               text NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending','processing','paid','fulfilled','cancelled','needs_family_approval')),
  needs_family_approval boolean NOT NULL DEFAULT false,
  family_approved_by   uuid REFERENCES family_members(id),
  family_approved_at   timestamptz,
  delivery_address     jsonb,                  -- {line1,city,state,zip}
  estimated_delivery   date,
  tracking_number      text,
  carrier              text,
  delivered_at         timestamptz,
  aria_intent_detected boolean NOT NULL DEFAULT false,
  aria_call_id         uuid                    -- if Aria detected the gift intent
);
ALTER TABLE gift_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "go_member_or_family" ON gift_orders;
CREATE POLICY "go_member_or_family" ON gift_orders FOR ALL
  USING (
    from_member_id = ANY(acting_member_ids())
    OR to_family_member_id IN (
      SELECT id FROM family_members WHERE supabase_auth_id = auth.uid()
    )
    OR is_staff()
  )
  WITH CHECK (
    from_member_id = ANY(acting_member_ids())
    OR is_staff()
  );

-- ─── G7.4 Family-initiated celebrations ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS celebration_requests (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at        timestamptz DEFAULT now() NOT NULL,
  member_id         uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  created_by        uuid NOT NULL,             -- family_member supabase_auth_id
  occasion          text NOT NULL,             -- 'birthday','anniversary','milestone','other'
  occasion_date     date NOT NULL,
  tier              text NOT NULL DEFAULT 'digital'
                    CHECK (tier IN ('digital','enhanced','premier')),
  title             text,
  description       text,
  stripe_session_id text,
  stripe_payment_intent text,
  amount_cents      integer NOT NULL DEFAULT 0,
  status            text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','paid','planning','active','complete','cancelled')),
  grief_guard_flagged boolean NOT NULL DEFAULT false,
  grief_guard_reviewed_by uuid,               -- navigator user_id
  grief_guard_approved_at timestamptz,
  volunteer_visit_booking_id uuid,            -- for Enhanced/Premier
  navigator_task_id uuid REFERENCES navigator_tasks(id),
  memory_book_requested boolean NOT NULL DEFAULT false,
  video_gathering_url text
);
ALTER TABLE celebration_requests ENABLE ROW LEVEL SECURITY;
-- Senior CANNOT see the planning room (celebration_requests) until status=active/complete
DROP POLICY IF EXISTS "cr_family_or_staff" ON celebration_requests;
CREATE POLICY "cr_family_or_staff" ON celebration_requests FOR ALL
  USING (
    -- family who created it
    created_by = auth.uid()
    -- staff always see
    OR is_staff()
    -- member can only see once active or complete
    OR (
      member_id = ANY(acting_member_ids())
      AND status IN ('active','complete')
    )
  )
  WITH CHECK (
    created_by = auth.uid() OR is_staff()
  );

CREATE TABLE IF NOT EXISTS celebration_messages (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at        timestamptz DEFAULT now() NOT NULL,
  celebration_id    uuid REFERENCES celebration_requests(id) ON DELETE CASCADE,
  -- Also used for birthday arc D-3 circle wishes (celebration_id NULL, member_id set)
  member_id         uuid REFERENCES members(id) ON DELETE CASCADE,
  author_id         uuid NOT NULL,             -- family_member or community member supabase_auth_id
  author_name       text NOT NULL,
  message           text NOT NULL,
  media_url         text,                      -- optional voice note URL
  is_birthday_wish  boolean NOT NULL DEFAULT false,
  wish_date         date,                      -- the birthday date this wish is for
  compiled_in_pdf   boolean NOT NULL DEFAULT false
);
ALTER TABLE celebration_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cm_read_celebration_or_birthday" ON celebration_messages;
CREATE POLICY "cm_read_celebration_or_birthday" ON celebration_messages FOR SELECT
  USING (
    -- family coordination messages: family or staff
    (celebration_id IS NOT NULL AND (
      is_staff()
      OR author_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM celebration_requests cr
        WHERE cr.id = celebration_id
          AND (cr.created_by = auth.uid() OR is_staff()
               OR (cr.member_id = ANY(acting_member_ids()) AND cr.status IN ('active','complete')))
      )
    ))
    -- birthday wishes: the member sees them on D-0
    OR (is_birthday_wish = true AND member_id = ANY(acting_member_ids()))
    -- family sees birthday wishes for their member
    OR (is_birthday_wish = true AND member_id IN (
      SELECT member_id FROM family_members WHERE supabase_auth_id = auth.uid()
    ))
    OR is_staff()
  );
DROP POLICY IF EXISTS "cm_insert" ON celebration_messages;
CREATE POLICY "cm_insert" ON celebration_messages FOR INSERT
  WITH CHECK (author_id = auth.uid() OR is_staff());

-- ─── G7.5 Birthday arc — celebration_opt_out flag ───────────────────────────

ALTER TABLE members ADD COLUMN IF NOT EXISTS celebration_opt_out boolean NOT NULL DEFAULT false;

-- ─── G7.6 Milestone birthday programs ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS milestone_birthday_programs (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  age           integer NOT NULL UNIQUE,
  offering      text NOT NULL,                -- human-readable description
  action_type   text NOT NULL CHECK (action_type IN ('navigator_task','navigator_call','joy_call','community_event','external_letter','memory_book')),
  action_days_before integer NOT NULL DEFAULT 30,  -- trigger N days before birthday
  enabled       boolean NOT NULL DEFAULT true
);

-- Seed the milestone programs
INSERT INTO milestone_birthday_programs (age, offering, action_type, action_days_before) VALUES
  (70, 'Life-story video prompt — navigator creates a task to record memories',
   'navigator_task', 30),
  (75, 'Memory book offer + navigator call to plan it',
   'navigator_call', 30),
  (80, 'Recorded phone interview — Joy asks life questions (with consent); recording saved to life story',
   'joy_call', 30),
  (85, 'Centennial celebration — community toast event auto-created; optional mayor/governor letter',
   'community_event', 30),
  (90, 'Super-milestone — community toast event + optional greeting-letter request for navigator',
   'community_event', 30),
  (95, 'Milestone celebration — community toast + navigator greeting-letter task',
   'community_event', 30),
  (100, 'Century! Full celebration — community toast, mayor/governor letter, memory book, Joy call',
   'community_event', 60)
ON CONFLICT (age) DO NOTHING;

-- ─── G5.4 Member achievements ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS member_achievements (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at       timestamptz DEFAULT now() NOT NULL,
  member_id        uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  type             text NOT NULL CHECK (type IN (
                   'first_class_taught',
                   'platform_anniversary',
                   'home_from_hospital',
                   'life_document_completed',
                   'skill_exchange_milestone',
                   'volunteer_milestone',
                   'other'
                   )),
  occurred_at      timestamptz NOT NULL DEFAULT now(),
  shared_with_family boolean NOT NULL DEFAULT true,
  metadata         jsonb,                      -- e.g. {document_type, class_title}
  family_highlight_sent_at timestamptz,
  joy_call_scheduled_at timestamptz,
  navigator_task_id uuid REFERENCES navigator_tasks(id)
);
ALTER TABLE member_achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ma_own_or_family_or_staff" ON member_achievements;
CREATE POLICY "ma_own_or_family_or_staff" ON member_achievements FOR SELECT
  USING (
    member_id = ANY(acting_member_ids())
    OR (shared_with_family AND member_id IN (
      SELECT member_id FROM family_members WHERE supabase_auth_id = auth.uid()
    ))
    OR is_staff()
  );
DROP POLICY IF EXISTS "ma_staff_write" ON member_achievements;
CREATE POLICY "ma_staff_write" ON member_achievements FOR ALL USING (is_staff());

-- ─── G6.0 Community partners ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS community_partners (
  id                   uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at           timestamptz DEFAULT now() NOT NULL,
  name                 text NOT NULL,
  category             text NOT NULL CHECK (category IN (
                       'home_sharing','home_repair','home_modification','employment','scsep',
                       'medicare_counseling','housing','other')),
  description          text,
  service_counties     text[] NOT NULL DEFAULT '{}',
  service_zip_prefixes text[] NOT NULL DEFAULT '{}',
  phone                text,
  website              text,
  referral_method      text NOT NULL DEFAULT 'warm_call'
                       CHECK (referral_method IN ('warm_call','member_calls','online_form','email','api')),
  referral_email       text,
  eligibility_notes    text,
  cost_to_member       text,
  status               text NOT NULL DEFAULT 'pending_confirmation'
                       CHECK (status IN ('pending_confirmation','active','paused')),
  confirmed_by         uuid REFERENCES family_members(id),
  confirmed_at         timestamptz,
  mou_signed           boolean NOT NULL DEFAULT false
);
ALTER TABLE community_partners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cp_read_active" ON community_partners;
CREATE POLICY "cp_read_active" ON community_partners FOR SELECT
  USING (status = 'active' OR is_staff());
DROP POLICY IF EXISTS "cp_staff_write" ON community_partners;
CREATE POLICY "cp_staff_write" ON community_partners FOR ALL USING (is_staff());

-- Seed the 7 community partners (all pending_confirmation)
INSERT INTO community_partners (name, category, service_counties, phone, website, referral_method, description, cost_to_member, eligibility_notes) VALUES
  ('Hassett Hardware — Handyman Program',
   'home_repair',
   ARRAY['San Mateo'],
   NULL, NULL, 'warm_call',
   'Licensed contractor partner; discounted work for home safety improvements. Used by Foster City Village.',
   'Sliding scale / discounted',
   'Available for home safety repairs and modifications'),
  ('HIP Housing — Home Sharing Program',
   'home_sharing',
   ARRAY['San Mateo'],
   '650-348-6660', 'https://www.hiphousing.org', 'warm_call',
   'Interviews, references, income check and photo ID; matches home providers and seekers; Living Together Agreement; ongoing follow-up; home visits for homebound seniors. Rent or service exchange.',
   'Free (program services)',
   'Income screening; home provider or home seeker'),
  ('Rebuilding Together Peninsula — Safe at Home',
   'home_repair',
   ARRAY['San Mateo', 'Santa Clara'],
   '650-366-6597', 'https://www.rebuildingtogetherpeninsula.org', 'warm_call',
   'Free safety and health repairs and modifications for low-income homeowners.',
   'Free',
   'Low-income homeowners in San Mateo or north Santa Clara counties'),
  ('Center for Independence of Individuals with Disabilities (CID)',
   'home_modification',
   ARRAY['San Mateo'],
   '650-645-1780', NULL, 'warm_call',
   'Grab bars, railings, ramps for people with disabilities.',
   'Contact for details',
   'People with disabilities'),
  ('Felton Institute — SCSEP',
   'scsep',
   ARRAY['San Mateo', 'Marin'],
   NULL, NULL, 'warm_call',
   'Senior Community Service Employment Program provider per California Dept. of Aging.',
   'Free (paid training positions)',
   'Low-income adults 55+'),
  ('NOVAworks Job Center — San Mateo',
   'employment',
   ARRAY['San Mateo'],
   NULL, 'https://www.novaworks.org', 'member_calls',
   '1777 Borel Place, Suite 500, San Mateo. Public workforce board job centre: job search, training, career coaching.',
   'Free',
   'All adults; ask about older-worker programs'),
  ('HICAP of San Mateo County',
   'medicare_counseling',
   ARRAY['San Mateo'],
   NULL, NULL, 'warm_call',
   'Free, unbiased Medicare counselling (state HICAP programme overseen by California Department of Aging). Used for Medicare open enrollment help.',
   'Free',
   'Medicare beneficiaries and those approaching eligibility')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS partner_referrals (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at        timestamptz DEFAULT now() NOT NULL,
  member_id         uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  partner_id        uuid NOT NULL REFERENCES community_partners(id),
  program           text NOT NULL,
  consent_given     boolean NOT NULL DEFAULT false,
  consent_at        timestamptz,
  status            text NOT NULL DEFAULT 'requested'
                    CHECK (status IN ('requested','sent','partner_contacted','in_progress','completed','declined','closed')),
  navigator_task_id uuid REFERENCES navigator_tasks(id),
  notes             text,
  next_check_in     date
);
ALTER TABLE partner_referrals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pr_own_or_staff" ON partner_referrals;
CREATE POLICY "pr_own_or_staff" ON partner_referrals FOR ALL
  USING (member_id = ANY(acting_member_ids()) OR is_staff())
  WITH CHECK (member_id = ANY(acting_member_ids()) OR is_staff());

-- ─── G6.2 Home sharing ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS home_sharing_interest (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  member_id  uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  role       text NOT NULL CHECK (role IN ('provider','seeker')),
  county     text NOT NULL,
  timeline   text,
  hopes      text,
  concerns   text,
  status     text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','referred','closed')),
  referral_id uuid
);
ALTER TABLE home_sharing_interest ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "hsi_own_or_staff" ON home_sharing_interest;
CREATE POLICY "hsi_own_or_staff" ON home_sharing_interest FOR ALL
  USING (member_id = ANY(acting_member_ids()) OR is_staff())
  WITH CHECK (member_id = ANY(acting_member_ids()) OR is_staff());

CREATE TABLE IF NOT EXISTS home_sharing_referrals (
  id                       uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at               timestamptz DEFAULT now() NOT NULL,
  member_id                uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  program_name             text NOT NULL,
  program_url              text,
  referred_at              timestamptz NOT NULL DEFAULT now(),
  referred_by              uuid,                -- navigator user_id
  consent_at               timestamptz,
  participation_status     text NOT NULL DEFAULT 'referred'
                           CHECK (participation_status IN (
                             'referred','application_submitted','enrolled',
                             'completed','withdrawn','not_eligible'
                           )),
  participation_updated_at timestamptz,
  notes                    text
);
ALTER TABLE home_sharing_referrals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "hsr_own_or_staff" ON home_sharing_referrals;
CREATE POLICY "hsr_own_or_staff" ON home_sharing_referrals FOR ALL
  USING (member_id = ANY(acting_member_ids()) OR is_staff())
  WITH CHECK (member_id = ANY(acting_member_ids()) OR is_staff());

-- ─── G7.15 Transition plans ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS transition_plans (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at       timestamptz DEFAULT now() NOT NULL,
  member_id        uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  navigator_id     uuid,                        -- navigator user_id
  plan_type        text NOT NULL DEFAULT 'facility_move'
                   CHECK (plan_type IN ('facility_move','housing_change','other')),
  title            text NOT NULL,
  status           text NOT NULL DEFAULT 'active'
                   CHECK (status IN ('active','paused','complete','cancelled')),
  family_can_see   boolean NOT NULL DEFAULT false,
  target_date      date,
  facility_name    text,
  facility_address text,
  notes            text
);
ALTER TABLE transition_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tp_own_or_family_or_staff" ON transition_plans;
CREATE POLICY "tp_own_or_family_or_staff" ON transition_plans FOR ALL
  USING (
    member_id = ANY(acting_member_ids())
    OR is_staff()
    OR (family_can_see AND member_id IN (
      SELECT member_id FROM family_members WHERE supabase_auth_id = auth.uid()
    ))
  )
  WITH CHECK (member_id = ANY(acting_member_ids()) OR is_staff());

CREATE TABLE IF NOT EXISTS transition_plan_steps (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at      timestamptz DEFAULT now() NOT NULL,
  plan_id         uuid NOT NULL REFERENCES transition_plans(id) ON DELETE CASCADE,
  week_number     integer NOT NULL,            -- 1-6
  category        text NOT NULL CHECK (category IN (
                  'facility_research','visit','paperwork','family_coordination',
                  'moving_day','post_move_checkin'
                  )),
  title           text NOT NULL,
  description     text,
  due_date        date,
  completed_at    timestamptz,
  completed_by    uuid,
  sort_order      integer NOT NULL DEFAULT 0
);
ALTER TABLE transition_plan_steps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tps_via_plan" ON transition_plan_steps;
CREATE POLICY "tps_via_plan" ON transition_plan_steps FOR ALL
  USING (
    plan_id IN (
      SELECT id FROM transition_plans
      WHERE member_id = ANY(acting_member_ids())
        OR is_staff()
        OR (family_can_see AND member_id IN (
          SELECT member_id FROM family_members WHERE supabase_auth_id = auth.uid()
        ))
    )
  );

-- ─── G7.16 Trusted advisor categories ───────────────────────────────────────

-- trusted_advisors table should already exist (migration 065); add columns if missing
ALTER TABLE trusted_advisors ADD COLUMN IF NOT EXISTS license_number text;
ALTER TABLE trusted_advisors ADD COLUMN IF NOT EXISTS license_state   text;
ALTER TABLE trusted_advisors ADD COLUMN IF NOT EXISTS telehealth_available boolean NOT NULL DEFAULT false;
ALTER TABLE trusted_advisors ADD COLUMN IF NOT EXISTS non_proselytizing boolean;  -- for chaplain category
-- Extend the category CHECK by recreating the constraint
ALTER TABLE trusted_advisors DROP CONSTRAINT IF EXISTS trusted_advisors_category_check;
ALTER TABLE trusted_advisors ADD CONSTRAINT trusted_advisors_category_check
  CHECK (category IN (
    'elder_law_attorney','financial_advisor','cpa','daily_money_manager',
    'geriatric_care_manager','therapist','grief_counselor','chaplain','other'
  ));

-- ─── G7.21 988/SAMHSA inline crisis resources ────────────────────────────────

-- No schema change needed; crisis line info is UI-only content in components.
-- VITA integration tracked via service_bookings with service_type='tax_help'.

-- ─── G7.23 Premium add-on SKUs ───────────────────────────────────────────────

-- premium_addons table should already exist; insert missing SKUs
INSERT INTO premium_addons (slug, name, description, price_cents, billing_type, fulfillment_type, active)
VALUES
  ('family_onboarding_call', 'Family Onboarding Call',
   'A 30-minute call with a navigator to help your family get the most out of ThriveAtHome.',
   2900, 'one_time', 'navigator_task', true),
  ('extra_navigator_hours', 'Extra Navigator Hours',
   'Additional navigator support beyond your plan''s monthly allotment ($25/hour).',
   2500, 'one_time', 'time_credit', true),
  ('companion_credit_bundle', 'Companion Credit Bundle',
   'Get $120 in companion credits for $100 (20% bonus).',
   10000, 'one_time', 'companion_credit', true),
  ('family_cosigned_birthday_card', 'Family Co-signed Birthday Card',
   'A beautiful keepsake card where every family member can add their signature and a personal note.',
   999, 'one_time', 'card_production', true)
ON CONFLICT (slug) DO NOTHING;

-- ─── G7.24 Pet profiles ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS member_pets (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at  timestamptz DEFAULT now() NOT NULL,
  member_id   uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  name        text NOT NULL,
  species     text NOT NULL DEFAULT 'dog' CHECK (species IN ('dog','cat','bird','rabbit','fish','reptile','other')),
  breed       text,
  birthday    date,
  photo_path  text,
  notes       text,
  is_deceased boolean NOT NULL DEFAULT false,
  deceased_at date
);
ALTER TABLE member_pets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mp_own_or_staff" ON member_pets;
CREATE POLICY "mp_own_or_staff" ON member_pets FOR ALL
  USING (member_id = ANY(acting_member_ids()) OR is_staff())
  WITH CHECK (member_id = ANY(acting_member_ids()) OR is_staff());

-- ─── G7.10 Volunteer specialties ─────────────────────────────────────────────

ALTER TABLE volunteers ADD COLUMN IF NOT EXISTS professional_specialty text
  CHECK (professional_specialty IN ('doctor','lawyer','cpa','teacher','engineer','nurse','social_worker','other'));
-- volunteer_category: widen to include new types (drop/recreate constraint)
ALTER TABLE volunteers DROP CONSTRAINT IF EXISTS volunteers_volunteer_category_check;
ALTER TABLE volunteers ADD CONSTRAINT volunteers_volunteer_category_check
  CHECK (volunteer_category IN (
    'buddy','companion','skill_share','driver','errand',
    'home_safety_volunteer','retired_professional','neighbor',
    'chaplain','student','veteran','k12_youth','corporate','other'
  ));

-- ─── G7.11 Corporate volunteer tiers ─────────────────────────────────────────

ALTER TABLE corporate_volunteer_programs ADD COLUMN IF NOT EXISTS tier text
  CHECK (tier IN ('partner','champion','leader'));
-- Assign tiers based on annual hour targets
-- partner: 50-200 hrs, champion: 200-500, leader: 500+
-- Tier is re-computed by a cron but can be set manually

-- ─── G7.12 Neighbor volunteers ───────────────────────────────────────────────
-- Uses volunteer_category = 'neighbor' (added above)
-- Zip enforcement is in the matching logic, not schema

-- ─── G7.13 Family reciprocity credits ────────────────────────────────────────

ALTER TABLE time_bank_entries ADD COLUMN IF NOT EXISTS source text
  CHECK (source IN ('skill_exchange','volunteer_service','family_volunteer','admin_grant','redemption'));
ALTER TABLE time_bank_entries ADD COLUMN IF NOT EXISTS family_member_id uuid
  REFERENCES family_members(id);

-- ─── G6.3 Opportunities board ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS opportunities (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at          timestamptz DEFAULT now() NOT NULL,
  title               text NOT NULL,
  org                 text,
  partner_id          uuid REFERENCES community_partners(id),
  type                text NOT NULL CHECK (type IN ('volunteer','paid_part_time','scsep','fellowship','internal')),
  description         text NOT NULL,
  location            text,
  remote              boolean NOT NULL DEFAULT false,
  hours_per_week      numeric,
  pay_range           text,
  age_friendly_attested boolean NOT NULL DEFAULT false,
  apply_method        text NOT NULL DEFAULT 'external_link'
                      CHECK (apply_method IN ('internal','partner_referral','external_link')),
  apply_url           text,
  status              text NOT NULL DEFAULT 'pending_review'
                      CHECK (status IN ('pending_review','published','closed','rejected')),
  posted_by           uuid,                    -- user_id of admin/employer
  approved_by         uuid,
  expires_on          date
);
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "opp_read_published" ON opportunities;
CREATE POLICY "opp_read_published" ON opportunities FOR SELECT
  USING (status = 'published' OR is_staff() OR posted_by = auth.uid());
DROP POLICY IF EXISTS "opp_staff_write" ON opportunities;
CREATE POLICY "opp_staff_write" ON opportunities FOR ALL USING (is_staff() OR posted_by = auth.uid());

CREATE TABLE IF NOT EXISTS opportunity_applications (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at      timestamptz DEFAULT now() NOT NULL,
  opportunity_id  uuid NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  member_id       uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  cover_note      text,
  status          text NOT NULL DEFAULT 'submitted'
                  CHECK (status IN ('submitted','under_review','accepted','declined','withdrawn')),
  reviewed_by     uuid,
  reviewed_at     timestamptz
);
ALTER TABLE opportunity_applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "oa_own_or_staff" ON opportunity_applications;
CREATE POLICY "oa_own_or_staff" ON opportunity_applications FOR ALL
  USING (member_id = ANY(acting_member_ids()) OR is_staff() OR
         opportunity_id IN (SELECT id FROM opportunities WHERE posted_by = auth.uid()))
  WITH CHECK (member_id = ANY(acting_member_ids()) OR is_staff());

-- ─── G6.4 Member-in-Need campaigns ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS member_campaigns (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at          timestamptz DEFAULT now() NOT NULL,
  member_id           uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  created_by          uuid NOT NULL,            -- family_member or member supabase_auth_id
  org_id              uuid,                     -- org sponsoring the campaign
  category            text NOT NULL CHECK (category IN (
                      'health_equipment','home_repair','food','utilities',
                      'transport','technology','other')),
  title               text NOT NULL,
  story               text,
  privacy_level       text NOT NULL DEFAULT 'first_name_only'
                      CHECK (privacy_level IN ('first_name_only','anonymous','full_name')),
  audience            text NOT NULL DEFAULT 'my_org'
                      CHECK (audience IN ('my_org','my_circles','platform')),
  goal_cents          integer NOT NULL,
  raised_cents        integer NOT NULL DEFAULT 0,
  deadline            date,
  status              text NOT NULL DEFAULT 'draft'
                      CHECK (status IN ('draft','pending_review','live','paused','fulfilled','closed')),
  recipient_type      text NOT NULL DEFAULT 'partner_org'
                      CHECK (recipient_type IN ('partner_org','vendor_payment')),
  recipient_org_id    uuid,
  approved_by         uuid,
  second_approver     uuid,                     -- required for goals > $1000
  member_story_approved_at timestamptz,         -- member must approve their own story
  fulfilled_note      text,
  receipt_path        text,
  fraud_flagged       boolean NOT NULL DEFAULT false
);
ALTER TABLE member_campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mc_own_or_staff" ON member_campaigns;
CREATE POLICY "mc_own_or_staff" ON member_campaigns FOR SELECT
  USING (
    -- member sees their own campaign
    member_id = ANY(acting_member_ids())
    -- family who created it
    OR created_by = auth.uid()
    -- logged-in users can see live campaigns per audience
    OR (status = 'live' AND (
      audience = 'platform'
      OR (audience = 'my_org' AND org_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM members m WHERE m.id = ANY(acting_member_ids()) AND m.org_id = member_campaigns.org_id
      ))
    ))
    OR is_staff()
  );
DROP POLICY IF EXISTS "mc_create" ON member_campaigns;
CREATE POLICY "mc_create" ON member_campaigns FOR INSERT
  WITH CHECK (member_id = ANY(acting_member_ids()) OR is_staff());
DROP POLICY IF EXISTS "mc_update" ON member_campaigns;
CREATE POLICY "mc_update" ON member_campaigns FOR UPDATE
  USING (member_id = ANY(acting_member_ids()) OR created_by = auth.uid() OR is_staff());

CREATE TABLE IF NOT EXISTS campaign_updates (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at   timestamptz DEFAULT now() NOT NULL,
  campaign_id  uuid NOT NULL REFERENCES member_campaigns(id) ON DELETE CASCADE,
  body         text NOT NULL,
  created_by   uuid NOT NULL
);
ALTER TABLE campaign_updates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cu_via_campaign" ON campaign_updates;
CREATE POLICY "cu_via_campaign" ON campaign_updates FOR SELECT
  USING (campaign_id IN (SELECT id FROM member_campaigns));

-- ─── Navigator time entries (G5.7) ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS navigator_time_entries (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at    timestamptz DEFAULT now() NOT NULL,
  member_id     uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  navigator_id  uuid NOT NULL,                 -- navigator user_id
  minutes       integer NOT NULL CHECK (minutes > 0),
  activity      text NOT NULL,
  logged_at     timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE navigator_time_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "nte_staff_write" ON navigator_time_entries;
CREATE POLICY "nte_staff_write" ON navigator_time_entries FOR ALL USING (is_staff());
DROP POLICY IF EXISTS "nte_member_read" ON navigator_time_entries;
CREATE POLICY "nte_member_read" ON navigator_time_entries FOR SELECT
  USING (member_id = ANY(acting_member_ids()));
