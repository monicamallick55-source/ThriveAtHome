-- Migration: member_campaigns (Phase 87)
-- Allows Complete/Community-module members to run fundraising campaigns

CREATE TABLE IF NOT EXISTS member_campaigns (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id           uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  org_id              uuid REFERENCES community_orgs(id) ON DELETE SET NULL,
  title               text NOT NULL,
  description         text NOT NULL,
  goal_cents          integer NOT NULL CHECK (goal_cents > 0),
  raised_cents        integer NOT NULL DEFAULT 0,
  status              text NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft', 'pending_review', 'active', 'paused', 'completed', 'rejected')),
  category            text NOT NULL DEFAULT 'general'
                        CHECK (category IN ('general', 'medical', 'home_repair', 'transportation', 'food', 'utilities', 'other')),
  stripe_product_id   text,
  stripe_price_id     text,
  navigator_notes     text,
  reviewed_by         uuid REFERENCES members(id),
  reviewed_at         timestamptz,
  rejection_reason    text,
  ends_at             timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS member_campaigns_member_idx ON member_campaigns (member_id);
CREATE INDEX IF NOT EXISTS member_campaigns_status_idx ON member_campaigns (status);
CREATE INDEX IF NOT EXISTS member_campaigns_org_idx ON member_campaigns (org_id);

CREATE TABLE IF NOT EXISTS campaign_donations (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id           uuid NOT NULL REFERENCES member_campaigns(id) ON DELETE CASCADE,
  donor_member_id       uuid REFERENCES members(id) ON DELETE SET NULL,
  amount_cents          integer NOT NULL CHECK (amount_cents > 0),
  stripe_session_id     text UNIQUE,
  stripe_payment_intent text,
  donor_name            text,
  donor_email           text,
  message               text,
  is_anonymous          boolean NOT NULL DEFAULT false,
  status                text NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending', 'completed', 'refunded', 'failed')),
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS campaign_donations_campaign_idx ON campaign_donations (campaign_id);
CREATE INDEX IF NOT EXISTS campaign_donations_session_idx ON campaign_donations (stripe_session_id);

-- Auto-update raised_cents when a donation completes
CREATE OR REPLACE FUNCTION update_campaign_raised_cents()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    UPDATE member_campaigns
      SET raised_cents = raised_cents + NEW.amount_cents,
          updated_at = now()
      WHERE id = NEW.campaign_id;
  END IF;
  RETURN NEW;
END;
$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'campaign_donation_completed') THEN
    CREATE TRIGGER campaign_donation_completed
      AFTER INSERT OR UPDATE ON campaign_donations
      FOR EACH ROW EXECUTE FUNCTION update_campaign_raised_cents();
  END IF;
END $$;

-- updated_at trigger
CREATE OR REPLACE FUNCTION set_campaign_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'member_campaigns_updated_at') THEN
    CREATE TRIGGER member_campaigns_updated_at
      BEFORE UPDATE ON member_campaigns
      FOR EACH ROW EXECUTE FUNCTION set_campaign_updated_at();
  END IF;
END $$;

-- RLS
ALTER TABLE member_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_donations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='member_campaigns' AND policyname='members_read_active_campaigns') THEN
    CREATE POLICY "members_read_active_campaigns" ON member_campaigns
      FOR SELECT USING (status = 'active' OR auth.uid() = (SELECT user_id FROM members WHERE id = member_id LIMIT 1));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='member_campaigns' AND policyname='service_role_all_campaigns') THEN
    CREATE POLICY "service_role_all_campaigns" ON member_campaigns
      FOR ALL USING (auth.role() = 'service_role');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='campaign_donations' AND policyname='service_role_all_donations') THEN
    CREATE POLICY "service_role_all_donations" ON campaign_donations
      FOR ALL USING (auth.role() = 'service_role');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='campaign_donations' AND policyname='members_read_own_donations') THEN
    CREATE POLICY "members_read_own_donations" ON campaign_donations
      FOR SELECT USING (donor_member_id = (SELECT id FROM members WHERE user_id = auth.uid() LIMIT 1));
  END IF;
END $$;
