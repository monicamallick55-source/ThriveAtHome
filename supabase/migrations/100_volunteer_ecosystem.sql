-- 100_volunteer_ecosystem.sql
-- G5.10 — Volunteer ecosystem completion
-- 1. VSO affiliation on volunteers
-- 2. Corporate volunteer program tiers
-- 3. Family reciprocity time-bank credits

-- ── 1. VSO affiliation ────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE vso_affiliation AS ENUM ('vfw', 'american_legion', 'dav', 'amvets', 'moaa', 'uso', 'other', 'none');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE volunteers
  ADD COLUMN IF NOT EXISTS vso_affiliation vso_affiliation NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS vso_member_number text;   -- optional membership #

-- ── 2. Corporate volunteer tiers ─────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE corp_volunteer_tier AS ENUM ('partner', 'champion', 'leader');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Add tier + hour target to corporate_volunteer_programs if it exists
DO $$ BEGIN
  ALTER TABLE corporate_volunteer_programs
    ADD COLUMN IF NOT EXISTS tier corp_volunteer_tier NOT NULL DEFAULT 'partner',
    ADD COLUMN IF NOT EXISTS hour_target integer NOT NULL DEFAULT 200,
    ADD COLUMN IF NOT EXISTS recognition_badge_url text;
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- ── 3. Family reciprocity time-bank ──────────────────────────────────────────

-- Credits earned by family volunteers helping other seniors
CREATE TABLE IF NOT EXISTS time_bank_credits (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at        timestamptz DEFAULT now() NOT NULL,

  -- Who earned it (a family_member volunteering for another senior)
  earner_family_member_id uuid NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,

  -- The senior whose account benefits (the earner's own senior)
  beneficiary_member_id   uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,

  -- The volunteer service that was performed
  service_booking_id      uuid REFERENCES service_bookings(id) ON DELETE SET NULL,

  -- How many credits (1 credit = 1 hour by default)
  credits               numeric(6,2) NOT NULL CHECK (credits > 0),
  hours_served          numeric(6,2) NOT NULL CHECK (hours_served > 0),

  -- What it was
  service_type          text NOT NULL,  -- e.g. "Grocery run", "Companionship call"
  performed_for_member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE, -- the OTHER senior

  -- Redemption
  redeemed_at           timestamptz,
  redeemed_service_booking_id uuid REFERENCES service_bookings(id) ON DELETE SET NULL,

  note                  text
);

-- Guard: earner's own senior may not be the same as performed_for_member_id
-- Enforced in API; DB-level check requires joining family_members which isn't possible here

CREATE INDEX IF NOT EXISTS time_bank_credits_earner_idx ON time_bank_credits(earner_family_member_id);
CREATE INDEX IF NOT EXISTS time_bank_credits_beneficiary_idx ON time_bank_credits(beneficiary_member_id);

-- RLS
ALTER TABLE time_bank_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "family member sees own credits"
  ON time_bank_credits FOR SELECT
  USING (earner_family_member_id IN (
    SELECT id FROM family_members WHERE supabase_auth_id = auth.uid()
  ));

CREATE POLICY "beneficiary member sees credits on their account"
  ON time_bank_credits FOR SELECT
  USING (beneficiary_member_id = ANY(acting_member_ids()));

CREATE POLICY "staff manages all time bank credits"
  ON time_bank_credits FOR ALL
  USING (is_staff());

-- ── Indexes on volunteers ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS volunteers_vso_idx ON volunteers(vso_affiliation);
