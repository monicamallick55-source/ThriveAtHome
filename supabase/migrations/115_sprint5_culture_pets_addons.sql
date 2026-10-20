-- Migration 115: Sprint 5 — Cultural Programming · Premium Add-ons · Pet Profiles
-- G7.22 Cultural programming depth
-- G7.23 Premium add-on SKUs
-- G7.24 Pet profiles + milestones

-- ── G7.22: Cultural programming ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cultural_festivals (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at      timestamptz DEFAULT now() NOT NULL,
  name            text NOT NULL,
  description     text,
  cultural_group  text NOT NULL,   -- e.g. 'chinese', 'jewish', 'hispanic', 'irish', 'african_american', 'indian', 'muslim', 'generic'
  month           integer NOT NULL CHECK (month BETWEEN 1 AND 12),
  day             integer CHECK (day BETWEEN 1 AND 31),  -- null = date varies by year
  is_active       boolean NOT NULL DEFAULT true,
  aria_script_key text    -- optional: reference to Aria script variant for this festival
);

ALTER TABLE cultural_festivals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cf_public_read" ON cultural_festivals FOR SELECT USING (is_active = true);
CREATE POLICY "cf_staff_write" ON cultural_festivals FOR ALL USING (is_staff());

CREATE TABLE IF NOT EXISTS member_cultural_interests (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at   timestamptz DEFAULT now() NOT NULL,
  member_id    uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  cultural_tag text NOT NULL,
  UNIQUE (member_id, cultural_tag)
);

ALTER TABLE member_cultural_interests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mci_member_rw" ON member_cultural_interests FOR ALL
  USING (member_id = ANY(acting_member_ids()) OR is_staff());

CREATE TABLE IF NOT EXISTS community_potlucks (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at      timestamptz DEFAULT now() NOT NULL,
  title           text NOT NULL,
  description     text,
  cultural_theme  text,
  event_date      date NOT NULL,
  event_time      time,
  location        text,
  max_attendees   integer,
  organizer_id    uuid REFERENCES members(id) ON DELETE SET NULL,
  status          text NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming','cancelled','completed')),
  dish_signups    jsonb NOT NULL DEFAULT '[]'::jsonb  -- [{member_id, dish, dietary_tags}]
);

ALTER TABLE community_potlucks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pot_read" ON community_potlucks FOR SELECT USING (status != 'cancelled' OR is_staff());
CREATE POLICY "pot_staff_write" ON community_potlucks FOR ALL USING (is_staff());

CREATE TABLE IF NOT EXISTS oral_history_entries (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at    timestamptz DEFAULT now() NOT NULL,
  member_id     uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  title         text NOT NULL,
  story_text    text NOT NULL,
  recorded_at   date NOT NULL DEFAULT CURRENT_DATE,
  decade        text,          -- e.g. '1950s', '1960s'
  themes        text[],        -- e.g. ['family','immigration','work','war']
  is_public     boolean NOT NULL DEFAULT false,   -- shared with village community
  approved_by   uuid REFERENCES family_members(id) ON DELETE SET NULL,
  voice_note_url text                              -- future: Retell audio
);

ALTER TABLE oral_history_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ohe_member_rw" ON oral_history_entries FOR ALL
  USING (member_id = ANY(acting_member_ids()) OR is_staff());
CREATE POLICY "ohe_public_read" ON oral_history_entries FOR SELECT
  USING (is_public = true AND approved_by IS NOT NULL);

-- ── G7.23: Premium add-on SKUs ─────────────────────────────────────────────

-- Add-ons are tied to members via member_plan_addons
-- SKUs:
--   family_onboarding    $29 one-time
--   navigator_hour       $25/hr (sold in 1-hr blocks)
--   companion_bundle     $100/mo
--   cosigned_card        $9.99/mo

CREATE TABLE IF NOT EXISTS addon_skus (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sku              text NOT NULL UNIQUE,
  name             text NOT NULL,
  description      text,
  price_cents      integer NOT NULL,
  billing_type     text NOT NULL CHECK (billing_type IN ('one_time','monthly','per_unit')),
  is_active        boolean NOT NULL DEFAULT true,
  stripe_price_id  text
);

-- Seed SKUs
INSERT INTO addon_skus (sku, name, description, price_cents, billing_type) VALUES
  ('family_onboarding', 'Family Onboarding', 'Guided onboarding session for family members — setup, training, and first navigator call', 2900, 'one_time'),
  ('navigator_hour', 'Navigator Hour', 'One hour of dedicated navigator time for complex tasks, care coordination, or research', 2500, 'per_unit'),
  ('companion_bundle', 'Companion Bundle', 'Enhanced daily companion calls + priority routing + personalized conversation memory', 10000, 'monthly'),
  ('cosigned_card', 'Co-Signed Card', 'Family-cosigned prepaid card for member independence with spending alerts', 999, 'monthly')
ON CONFLICT (sku) DO NOTHING;

CREATE TABLE IF NOT EXISTS member_addons (
  id                 uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at         timestamptz DEFAULT now() NOT NULL,
  member_id          uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  sku                text NOT NULL REFERENCES addon_skus(sku),
  status             text NOT NULL DEFAULT 'active' CHECK (status IN ('active','cancelled','expired')),
  quantity           integer NOT NULL DEFAULT 1,    -- for per_unit SKUs
  stripe_sub_id      text,
  stripe_payment_id  text,
  paid_through_date  date,
  activated_at       timestamptz DEFAULT now(),
  cancelled_at       timestamptz,
  requested_by       uuid REFERENCES family_members(id) ON DELETE SET NULL
);

ALTER TABLE member_addons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ma_member_read" ON member_addons FOR SELECT
  USING (member_id = ANY(acting_member_ids()) OR is_staff());
CREATE POLICY "ma_staff_write" ON member_addons FOR ALL USING (is_staff());

-- ── G7.24: Pet profiles + milestones ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS member_pets (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at    timestamptz DEFAULT now() NOT NULL,
  member_id     uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  name          text NOT NULL,
  species       text NOT NULL CHECK (species IN ('dog','cat','bird','fish','rabbit','reptile','other')),
  breed         text,
  birthday      date,
  adopted_at    date,
  color         text,
  photo_url     text,
  notes         text,
  is_deceased   boolean NOT NULL DEFAULT false,
  passed_at     date
);

ALTER TABLE member_pets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mp_member_rw" ON member_pets FOR ALL
  USING (member_id = ANY(acting_member_ids()) OR is_staff());

-- Pet milestones (birthdays auto-detected, adoption anniversaries, loss events)
CREATE TABLE IF NOT EXISTS pet_milestones (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  pet_id     uuid NOT NULL REFERENCES member_pets(id) ON DELETE CASCADE,
  member_id  uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  type       text NOT NULL CHECK (type IN ('birthday','adoption_anniversary','new_pet','loss','milestone')),
  occurred_at date NOT NULL,
  title      text NOT NULL,
  notes      text,
  shared_with_family boolean NOT NULL DEFAULT true
);

ALTER TABLE pet_milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pm_member_rw" ON pet_milestones FOR ALL
  USING (member_id = ANY(acting_member_ids()) OR is_staff());

-- ── Indexes ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS cf_month_idx ON cultural_festivals(month);
CREATE INDEX IF NOT EXISTS cf_group_idx ON cultural_festivals(cultural_group);
CREATE INDEX IF NOT EXISTS mci_member_idx ON member_cultural_interests(member_id);
CREATE INDEX IF NOT EXISTS pot_date_idx ON community_potlucks(event_date);
CREATE INDEX IF NOT EXISTS ohe_member_idx ON oral_history_entries(member_id);
CREATE INDEX IF NOT EXISTS ma_member_idx ON member_addons(member_id);
CREATE INDEX IF NOT EXISTS mp_member_idx ON member_pets(member_id);
CREATE INDEX IF NOT EXISTS pm_pet_idx ON pet_milestones(pet_id);
