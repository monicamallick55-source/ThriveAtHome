-- Migration: Member Campaigns
-- Community fundraising campaigns (member-created and platform-wide)
-- Created: 2026-10-30

CREATE TABLE IF NOT EXISTS campaigns (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id      UUID REFERENCES members(id) ON DELETE SET NULL,
  org_id          UUID REFERENCES organizations(id) ON DELETE SET NULL,

  title           TEXT NOT NULL,
  description     TEXT,
  story           TEXT,       -- longer personal story for the campaign page
  image_url       TEXT,

  campaign_type   TEXT NOT NULL DEFAULT 'community'
                    CHECK (campaign_type IN ('community', 'emergency', 'platform', 'b2b')),

  goal_cents      INTEGER NOT NULL DEFAULT 0,
  raised_cents    INTEGER NOT NULL DEFAULT 0,
  donor_count     INTEGER NOT NULL DEFAULT 0,

  status          TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'active', 'paused', 'completed', 'canceled')),

  starts_at       TIMESTAMPTZ,
  ends_at         TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,

  stripe_product_id TEXT,
  stripe_price_id   TEXT,

  is_public       BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured     BOOLEAN NOT NULL DEFAULT FALSE,

  metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Campaign donations (linked from stripe webhook handler)
CREATE TABLE IF NOT EXISTS campaign_donations (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id             UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  donor_member_id         UUID REFERENCES members(id) ON DELETE SET NULL,

  donor_name              TEXT NOT NULL DEFAULT 'Anonymous',
  donor_email             TEXT,

  amount_cents            INTEGER NOT NULL,
  currency                TEXT NOT NULL DEFAULT 'usd',

  stripe_payment_intent_id TEXT,
  stripe_charge_id         TEXT,

  is_anonymous            BOOLEAN NOT NULL DEFAULT FALSE,
  message                 TEXT,       -- optional message from donor

  status                  TEXT NOT NULL DEFAULT 'completed'
                            CHECK (status IN ('pending', 'completed', 'refunded', 'failed')),

  donated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger: keep campaigns.raised_cents + donor_count in sync
CREATE OR REPLACE FUNCTION update_campaign_totals()
RETURNS TRIGGER AS $$
DECLARE
  v_campaign_id UUID;
BEGIN
  v_campaign_id := COALESCE(NEW.campaign_id, OLD.campaign_id);

  UPDATE campaigns
  SET
    raised_cents = (
      SELECT COALESCE(SUM(amount_cents), 0)
      FROM campaign_donations
      WHERE campaign_id = v_campaign_id AND status = 'completed'
    ),
    donor_count = (
      SELECT COUNT(*)
      FROM campaign_donations
      WHERE campaign_id = v_campaign_id AND status = 'completed'
    ),
    updated_at = NOW()
  WHERE id = v_campaign_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_campaign_totals ON campaign_donations;
CREATE TRIGGER trg_update_campaign_totals
  AFTER INSERT OR UPDATE OR DELETE ON campaign_donations
  FOR EACH ROW EXECUTE FUNCTION update_campaign_totals();

-- updated_at trigger for campaigns
CREATE OR REPLACE FUNCTION update_campaigns_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_campaigns_updated_at ON campaigns;
CREATE TRIGGER trg_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_campaigns_updated_at();

-- RLS
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public campaigns are visible to all"
  ON campaigns FOR SELECT
  USING (is_public = TRUE AND status = 'active');

CREATE POLICY "Creators can manage their campaigns"
  ON campaigns FOR ALL
  USING (creator_id IN (SELECT id FROM members WHERE auth_id = auth.uid()))
  WITH CHECK (creator_id IN (SELECT id FROM members WHERE auth_id = auth.uid()));

CREATE POLICY "Platform admins can manage all campaigns"
  ON campaigns FOR ALL
  USING (EXISTS (SELECT 1 FROM members WHERE auth_id = auth.uid() AND role IN ('platform_admin', 'care_coordinator')))
  WITH CHECK (EXISTS (SELECT 1 FROM members WHERE auth_id = auth.uid() AND role IN ('platform_admin', 'care_coordinator')));

CREATE POLICY "Non-anonymous donations visible to campaign creator"
  ON campaign_donations FOR SELECT
  USING (
    is_anonymous = FALSE
    AND campaign_id IN (
      SELECT id FROM campaigns
      WHERE creator_id IN (SELECT id FROM members WHERE auth_id = auth.uid())
    )
  );

CREATE POLICY "Donors can view own donations"
  ON campaign_donations FOR SELECT
  USING (donor_member_id IN (SELECT id FROM members WHERE auth_id = auth.uid()));

CREATE POLICY "Platform admins can view all donations"
  ON campaign_donations FOR SELECT
  USING (EXISTS (SELECT 1 FROM members WHERE auth_id = auth.uid() AND role = 'platform_admin'));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_campaigns_status       ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_creator_id   ON campaigns(creator_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_is_featured  ON campaigns(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_campaign_donations_campaign ON campaign_donations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_donations_donor    ON campaign_donations(donor_member_id);
CREATE INDEX IF NOT EXISTS idx_campaign_donations_stripe   ON campaign_donations(stripe_payment_intent_id);
