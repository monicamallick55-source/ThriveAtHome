-- Migration 109: G6.4 Community Care Fund
-- Member-in-need campaigns with direct Zelle/Venmo payment (no platform money handling)

-- Campaign status lifecycle
CREATE TYPE IF NOT EXISTS campaign_status AS ENUM (
  'draft',          -- member submitted, pending navigator review
  'consent_pending',-- navigator reviewing, awaiting member consent call
  'active',         -- live, visible to family + circle
  'fulfilled',      -- goal met / need addressed
  'closed',         -- deadline passed or cancelled
  'withdrawn'       -- member withdrew request
);

-- Contribution type
CREATE TYPE IF NOT EXISTS contribution_type AS ENUM (
  'financial',   -- money via Zelle/Venmo/cash
  'in_kind',     -- groceries, supplies, etc.
  'volunteer'    -- time / errands / rides
);

-- Contribution status
CREATE TYPE IF NOT EXISTS contribution_status AS ENUM (
  'pledged',    -- family member expressed intent
  'confirmed',  -- navigator confirmed receipt
  'cancelled'   -- pledge withdrawn
);

-- Main campaigns table
CREATE TABLE IF NOT EXISTS member_campaigns (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at          timestamptz DEFAULT now() NOT NULL,
  updated_at          timestamptz DEFAULT now() NOT NULL,

  member_id           uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  created_by_fm_id    uuid REFERENCES family_members(id),   -- who submitted (member self or family)
  navigator_id        uuid REFERENCES family_members(id),   -- assigned navigator

  -- Content
  title               text NOT NULL,
  story               text NOT NULL,   -- dignified description of the need
  need_category       text NOT NULL,   -- 'rent','medical','utilities','food','supplies','other'
  goal_amount_cents   int,             -- null = non-financial / any help welcome
  deadline            date,

  -- Payment info (navigator fills in after consent call)
  payment_zelle       text,            -- member's Zelle phone/email
  payment_venmo       text,            -- member's Venmo handle
  payment_other       text,            -- e.g. "Send check to Navigator"

  -- Status & consent
  status              campaign_status NOT NULL DEFAULT 'draft',
  member_consent      boolean NOT NULL DEFAULT false,
  consent_date        timestamptz,
  visible_to_circle   boolean NOT NULL DEFAULT false,   -- member opts in to broader visibility

  -- Totals (denormalized for fast reads)
  total_pledged_cents int NOT NULL DEFAULT 0,
  total_confirmed_cents int NOT NULL DEFAULT 0,

  -- Navigator notes (internal only)
  navigator_notes     text,
  fulfilled_at        timestamptz,
  closed_at           timestamptz
);

-- Contributions / pledges
CREATE TABLE IF NOT EXISTS campaign_contributions (
  id                      uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at              timestamptz DEFAULT now() NOT NULL,
  updated_at              timestamptz DEFAULT now() NOT NULL,

  campaign_id             uuid NOT NULL REFERENCES member_campaigns(id) ON DELETE CASCADE,
  contributor_member_id   uuid REFERENCES members(id),  -- null if non-member contributor
  contributor_fm_id       uuid REFERENCES family_members(id),

  contribution_type       contribution_type NOT NULL DEFAULT 'financial',
  amount_cents            int,             -- for financial contributions
  in_kind_description     text,            -- for in_kind
  volunteer_date          date,            -- for volunteer
  message                 text,
  anonymous               boolean NOT NULL DEFAULT false,
  payment_method          text,            -- 'zelle','venmo','cash','check','other'

  status                  contribution_status NOT NULL DEFAULT 'pledged',
  confirmed_at            timestamptz,
  confirmed_by_fm_id      uuid REFERENCES family_members(id),
  navigator_notes         text
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_member_campaigns_member_id ON member_campaigns(member_id);
CREATE INDEX IF NOT EXISTS idx_member_campaigns_status ON member_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaign_contributions_campaign_id ON campaign_contributions(campaign_id);

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS member_campaigns_updated ON member_campaigns;
CREATE TRIGGER member_campaigns_updated
  BEFORE UPDATE ON member_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS campaign_contributions_updated ON campaign_contributions;
CREATE TRIGGER campaign_contributions_updated
  BEFORE UPDATE ON campaign_contributions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE member_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_contributions ENABLE ROW LEVEL SECURITY;

-- Member sees their own campaigns
DROP POLICY IF EXISTS "member_sees_own_campaigns" ON member_campaigns;
CREATE POLICY "member_sees_own_campaigns" ON member_campaigns FOR SELECT
  USING (
    member_id IN (
      SELECT member_id FROM family_members WHERE supabase_auth_id = auth.uid()
    )
  );

-- Family members see active campaigns for their member
DROP POLICY IF EXISTS "family_sees_active_campaigns" ON member_campaigns;
CREATE POLICY "family_sees_active_campaigns" ON member_campaigns FOR SELECT
  USING (
    status = 'active'
    AND member_id IN (
      SELECT DISTINCT fm2.member_id FROM family_members fm1
      JOIN family_members fm2 ON fm1.member_id = fm2.member_id
      WHERE fm1.supabase_auth_id = auth.uid()
    )
  );

-- Staff see all
DROP POLICY IF EXISTS "staff_sees_all_campaigns" ON member_campaigns;
CREATE POLICY "staff_sees_all_campaigns" ON member_campaigns FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM family_members
      WHERE supabase_auth_id = auth.uid()
        AND role IN ('admin','navigator')
    )
  );

-- Members can insert their own campaign requests
DROP POLICY IF EXISTS "member_creates_campaign" ON member_campaigns;
CREATE POLICY "member_creates_campaign" ON member_campaigns FOR INSERT
  WITH CHECK (
    member_id IN (
      SELECT member_id FROM family_members WHERE supabase_auth_id = auth.uid()
    )
  );

-- Contributions: family can insert pledges for active campaigns
DROP POLICY IF EXISTS "family_pledges_contribution" ON campaign_contributions;
CREATE POLICY "family_pledges_contribution" ON campaign_contributions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM member_campaigns mc
      JOIN family_members fm ON fm.member_id = mc.member_id
      WHERE mc.id = campaign_id
        AND mc.status = 'active'
        AND fm.supabase_auth_id = auth.uid()
    )
  );

-- Staff see all contributions
DROP POLICY IF EXISTS "staff_sees_all_contributions" ON campaign_contributions;
CREATE POLICY "staff_sees_all_contributions" ON campaign_contributions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM family_members
      WHERE supabase_auth_id = auth.uid()
        AND role IN ('admin','navigator')
    )
  );

-- Confirmed contributions visible to campaign's family
DROP POLICY IF EXISTS "family_sees_confirmed_contributions" ON campaign_contributions;
CREATE POLICY "family_sees_confirmed_contributions" ON campaign_contributions FOR SELECT
  USING (
    status = 'confirmed'
    AND EXISTS (
      SELECT 1 FROM member_campaigns mc
      JOIN family_members fm ON fm.member_id = mc.member_id
      WHERE mc.id = campaign_id
        AND fm.supabase_auth_id = auth.uid()
    )
  );
