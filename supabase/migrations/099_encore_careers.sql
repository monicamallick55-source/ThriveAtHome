-- 099_encore_careers.sql
-- G6.3 — Encore Careers: job board for members 55+ seeking meaningful work

CREATE TYPE career_work_type AS ENUM ('full_time', 'part_time', 'contract', 'volunteer', 'consulting', 'flexible');
CREATE TYPE opportunity_status AS ENUM ('draft', 'active', 'filled', 'expired', 'archived');
CREATE TYPE career_interest_status AS ENUM ('interested', 'applied', 'interviewing', 'offered', 'declined', 'hired');

-- Member career profiles (opt-in)
CREATE TABLE IF NOT EXISTS career_profiles (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at          timestamptz DEFAULT now() NOT NULL,
  updated_at          timestamptz DEFAULT now() NOT NULL,
  member_id           uuid NOT NULL UNIQUE REFERENCES members(id) ON DELETE CASCADE,
  active              boolean NOT NULL DEFAULT true,

  -- Background
  headline            text,                   -- e.g. "Retired teacher seeking tutoring work"
  summary             text,                   -- short bio / what they offer
  skills              text[],                 -- ["Teaching", "Excel", "Project Management"]
  industries          text[],                 -- ["Education", "Nonprofit", "Healthcare"]
  years_experience    integer,

  -- Preferences
  work_types          career_work_type[],     -- what they are open to
  hours_per_week_max  integer,                -- max hours willing to work
  remote_ok           boolean NOT NULL DEFAULT true,
  in_person_ok        boolean NOT NULL DEFAULT true,
  desired_pay         text,                   -- free text: "$20-25/hr", "volunteer only", etc.
  available_from      date,

  -- Digest opt-in
  digest_opted_in     boolean NOT NULL DEFAULT true
);

-- Job / volunteer opportunities
CREATE TABLE IF NOT EXISTS career_opportunities (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at          timestamptz DEFAULT now() NOT NULL,
  updated_at          timestamptz DEFAULT now() NOT NULL,
  posted_by           uuid REFERENCES members(id),    -- staff member who posted
  status              opportunity_status NOT NULL DEFAULT 'active',

  title               text NOT NULL,
  organization        text NOT NULL,
  description         text NOT NULL,
  work_type           career_work_type NOT NULL,
  location            text,                   -- "Foster City, CA" or "Remote"
  remote_ok           boolean NOT NULL DEFAULT false,
  hours_per_week      text,                   -- "10-15 hrs/week"
  pay                 text,                   -- "$18/hr", "Volunteer", "Negotiable"
  skills_desired      text[],
  industries          text[],
  apply_url           text,
  apply_email         text,
  closes_on           date,
  filled_at           timestamptz
);

-- Member interest / applications
CREATE TABLE IF NOT EXISTS career_interests (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at          timestamptz DEFAULT now() NOT NULL,
  updated_at          timestamptz DEFAULT now() NOT NULL,
  member_id           uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  opportunity_id      uuid NOT NULL REFERENCES career_opportunities(id) ON DELETE CASCADE,
  status              career_interest_status NOT NULL DEFAULT 'interested',
  note                text,                   -- member's cover note
  navigator_notes     text,
  UNIQUE (member_id, opportunity_id)
);

-- Weekly digest log (prevent duplicate sends)
CREATE TABLE IF NOT EXISTS career_digest_log (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sent_at             timestamptz DEFAULT now() NOT NULL,
  member_id           uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  opportunity_ids     uuid[] NOT NULL,
  week_of             date NOT NULL,
  UNIQUE (member_id, week_of)
);

-- RLS
ALTER TABLE career_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_digest_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "member manages own career profile"
  ON career_profiles FOR ALL
  USING (member_id = ANY(acting_member_ids()));

CREATE POLICY "staff sees all career profiles"
  ON career_profiles FOR SELECT
  USING (is_staff());

CREATE POLICY "active opportunities visible to members"
  ON career_opportunities FOR SELECT
  USING (status = 'active' OR is_staff());

CREATE POLICY "staff manages opportunities"
  ON career_opportunities FOR ALL
  USING (is_staff());

CREATE POLICY "member manages own interests"
  ON career_interests FOR ALL
  USING (member_id = ANY(acting_member_ids()));

CREATE POLICY "staff sees all interests"
  ON career_interests FOR SELECT
  USING (is_staff());

CREATE POLICY "staff sees digest log"
  ON career_digest_log FOR ALL
  USING (is_staff());

-- updated_at triggers
CREATE OR REPLACE FUNCTION touch_career_profile() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER career_profiles_updated BEFORE UPDATE ON career_profiles FOR EACH ROW EXECUTE FUNCTION touch_career_profile();

CREATE OR REPLACE FUNCTION touch_career_opportunity() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER career_opportunities_updated BEFORE UPDATE ON career_opportunities FOR EACH ROW EXECUTE FUNCTION touch_career_opportunity();

-- Indexes
CREATE INDEX IF NOT EXISTS career_profiles_member_idx ON career_profiles(member_id);
CREATE INDEX IF NOT EXISTS career_opportunities_status_idx ON career_opportunities(status);
CREATE INDEX IF NOT EXISTS career_interests_member_idx ON career_interests(member_id);
CREATE INDEX IF NOT EXISTS career_interests_opportunity_idx ON career_interests(opportunity_id);
