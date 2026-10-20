-- 098_home_sharing.sql
-- G6.2 — Home Sharing Program
-- Connects seniors who want to share their home with those seeking housing

CREATE TYPE home_sharing_status AS ENUM (
  'inquiring',      -- member submitted interest form
  'screening',      -- navigator reviewing / background check in progress
  'matched',        -- navigator has identified a potential match
  'trial',          -- trial living arrangement in place
  'active',         -- confirmed home share arrangement
  'paused',         -- temporarily on hold
  'closed'          -- arrangement ended or member withdrew
);

CREATE TYPE home_sharing_role AS ENUM ('host', 'seeker');

CREATE TABLE IF NOT EXISTS home_sharing_referrals (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at          timestamptz DEFAULT now() NOT NULL,
  updated_at          timestamptz DEFAULT now() NOT NULL,
  member_id           uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  role                home_sharing_role NOT NULL,  -- host or seeker
  status              home_sharing_status NOT NULL DEFAULT 'inquiring',

  -- Host details
  home_description    text,               -- bedrooms, bathrooms, amenities
  rent_expectation    text,               -- e.g. "$800/mo" or "services in lieu"
  preferred_move_in   date,
  house_rules         text,               -- pets, smoking, quiet hours, etc.

  -- Seeker details
  budget_description  text,               -- what they can afford
  desired_location    text,               -- city/neighbourhood preference
  move_in_by          date,

  -- Shared fields
  notes               text,               -- member's free-text notes
  navigator_notes     text,               -- internal staff notes
  matched_member_id   uuid REFERENCES members(id),  -- the other party when matched
  navigator_id        uuid REFERENCES members(id),   -- assigned navigator
  consent_shared_at   timestamptz,        -- when member consented to info sharing

  CONSTRAINT home_sharing_referrals_role_check CHECK (
    (role = 'host' AND home_description IS NOT NULL) OR
    (role = 'seeker' AND desired_location IS NOT NULL) OR
    (notes IS NOT NULL)  -- allow partial submissions
  )
);

-- RLS
ALTER TABLE home_sharing_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "member sees own home sharing referral"
  ON home_sharing_referrals FOR SELECT
  USING (member_id = ANY(acting_member_ids()));

CREATE POLICY "staff sees all home sharing referrals"
  ON home_sharing_referrals FOR ALL
  USING (is_staff());

-- updated_at trigger
CREATE OR REPLACE FUNCTION touch_home_sharing_referral()
  RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER home_sharing_referrals_updated
  BEFORE UPDATE ON home_sharing_referrals
  FOR EACH ROW EXECUTE FUNCTION touch_home_sharing_referral();

-- Index
CREATE INDEX IF NOT EXISTS home_sharing_referrals_member_idx ON home_sharing_referrals(member_id);
CREATE INDEX IF NOT EXISTS home_sharing_referrals_status_idx ON home_sharing_referrals(status);
