-- Migration 096: Community Partners (G6.0)
-- The community_partners table already exists with legacy columns.
-- This migration adds the new columns needed for G6.0 (status, category, etc.)
-- and creates the partner_referrals table.

-- ── Alter existing community_partners table ───────────────────────────────────

-- Add new columns if they don't already exist
ALTER TABLE community_partners
  ADD COLUMN IF NOT EXISTS status       text NOT NULL DEFAULT 'pending_confirmation'
                                          CHECK (status IN ('active','pending_confirmation','inactive')),
  ADD COLUMN IF NOT EXISTS category     text,
  ADD COLUMN IF NOT EXISTS website_url  text,
  ADD COLUMN IF NOT EXISTS phone        text,
  ADD COLUMN IF NOT EXISTS email        text,
  ADD COLUMN IF NOT EXISTS contact_name text,
  ADD COLUMN IF NOT EXISTS notes        text,
  ADD COLUMN IF NOT EXISTS updated_at   timestamptz NOT NULL DEFAULT now();

-- Map legacy `active` boolean → new `status` text (only if `active` column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'community_partners' AND column_name = 'active'
  ) THEN
    UPDATE community_partners SET status = 'active'   WHERE active = true;
    UPDATE community_partners SET status = 'inactive' WHERE active = false;
  END IF;
END $$;

-- Map legacy `org_name` → `name` (only if `org_name` exists and `name` doesn't)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'community_partners' AND column_name = 'org_name'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'community_partners' AND column_name = 'name'
  ) THEN
    ALTER TABLE community_partners RENAME COLUMN org_name TO name;
  END IF;
END $$;

-- Map legacy `contact_phone` → `phone` (only if it exists and phone doesn't)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'community_partners' AND column_name = 'contact_phone'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'community_partners' AND column_name = 'phone'
  ) THEN
    -- Copy values into the new phone column
    UPDATE community_partners cp
    SET phone = cp2.contact_phone
    FROM community_partners cp2
    WHERE cp.id = cp2.id AND cp2.contact_phone IS NOT NULL;
  END IF;
END $$;

-- Map legacy `website` → `website_url` (only if it exists and website_url is empty)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'community_partners' AND column_name = 'website'
  ) THEN
    UPDATE community_partners cp
    SET website_url = cp2.website
    FROM community_partners cp2
    WHERE cp.id = cp2.id AND cp2.website IS NOT NULL AND cp.website_url IS NULL;
  END IF;
END $$;

-- Add indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_community_partners_status   ON community_partners(status);
CREATE INDEX IF NOT EXISTS idx_community_partners_category ON community_partners(category);

-- ── partner_referrals (new table) ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS partner_referrals (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id      uuid NOT NULL REFERENCES community_partners(id) ON DELETE CASCADE,
  member_id       uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  referred_by     uuid          REFERENCES family_members(id) ON DELETE SET NULL,
  reason          text,
  status          text NOT NULL DEFAULT 'sent'
                    CHECK (status IN ('sent','connected','declined','no_response')),
  outcome_note    text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partner_referrals_partner ON partner_referrals(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_referrals_member  ON partner_referrals(member_id);

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE community_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_referrals  ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist before recreating
DROP POLICY IF EXISTS "members read active partners" ON community_partners;
DROP POLICY IF EXISTS "staff manage partners"        ON community_partners;
DROP POLICY IF EXISTS "members read own referrals"  ON partner_referrals;
DROP POLICY IF EXISTS "staff manage referrals"      ON partner_referrals;

-- community_partners: members read active; staff read/write all
CREATE POLICY "members read active partners"
  ON community_partners FOR SELECT
  USING (status = 'active' OR is_staff());

CREATE POLICY "staff manage partners"
  ON community_partners FOR ALL
  USING (is_staff())
  WITH CHECK (is_staff());

-- partner_referrals: members see their own; staff see all; staff insert/update
CREATE POLICY "members read own referrals"
  ON partner_referrals FOR SELECT
  USING (member_id = ANY(acting_member_ids()) OR is_staff());

CREATE POLICY "staff manage referrals"
  ON partner_referrals FOR ALL
  USING (is_staff())
  WITH CHECK (is_staff());

-- ── updated_at trigger ────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_community_partners_updated_at'
  ) THEN
    CREATE TRIGGER trg_community_partners_updated_at
      BEFORE UPDATE ON community_partners
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_partner_referrals_updated_at'
  ) THEN
    CREATE TRIGGER trg_partner_referrals_updated_at
      BEFORE UPDATE ON partner_referrals
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

-- ── Seed: 7 community partners (skip if they already exist by name) ────────────
-- Include org_type to satisfy the existing NOT NULL constraint on that column.

-- org_type uses existing values: faith_community, library, transportation,
-- home_services, grocery, pharmacy, senior_center
INSERT INTO community_partners (name, org_type, category, description, website_url, phone, status, city, state)
VALUES
  (
    'Meals on Wheels America', 'home_services', 'food',
    'Delivers nutritious meals to homebound seniors and provides regular safety checks and social interaction during deliveries.',
    'https://www.mealsonwheelsamerica.org', '1-888-998-6325', 'pending_confirmation', NULL, NULL
  ),
  (
    'AARP Foundation', 'senior_center', 'legal',
    'Free legal services, tax preparation assistance (Tax-Aide), and job training programs for adults 50+ facing economic challenges.',
    'https://www.aarp.org/aarp-foundation', '1-800-775-6776', 'pending_confirmation', NULL, NULL
  ),
  (
    'National Council on Aging (NCOA)', 'senior_center', 'health',
    'Benefits enrollment assistance (BenefitsCheckUp), falls prevention programs, and chronic disease self-management workshops.',
    'https://www.ncoa.org', '1-571-527-3900', 'pending_confirmation', NULL, NULL
  ),
  (
    'ITNAmerica', 'transportation', 'transportation',
    'Affordable, dignified transportation for older adults and people with visual impairment through a volunteer-driver model.',
    'https://www.itnamerica.org', '1-207-857-9001', 'pending_confirmation', NULL, NULL
  ),
  (
    'SeniorCorps / AmeriCorps Seniors', 'senior_center', 'social',
    'Volunteer matching for seniors — Foster Grandparents, Senior Companions, and RSVP programs that reduce isolation.',
    'https://americorps.gov/serve/americorps-seniors', '1-800-942-2677', 'pending_confirmation', NULL, NULL
  ),
  (
    'National Shared Housing Resource Center', 'home_services', 'home',
    'Connects older adults seeking affordable housing with compatible housemates; helps seniors age in place.',
    'https://nationalsharedhousing.org', NULL, 'pending_confirmation', NULL, NULL
  ),
  (
    'SCORE Mentors', 'senior_center', 'employment',
    'Free business mentoring and workshops for seniors considering encore careers, self-employment, or consulting work.',
    'https://www.score.org', '1-800-634-0245', 'pending_confirmation', NULL, NULL
  )
ON CONFLICT DO NOTHING;
