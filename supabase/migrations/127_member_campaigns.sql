-- Migration 127: Member-Run Campaigns

CREATE TABLE IF NOT EXISTS member_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  cause_category text NOT NULL CHECK (cause_category IN ('health','community','education','arts','environment','seniors','other')),
  goal_amount numeric(10,2) NOT NULL CHECK (goal_amount > 0),
  raised_amount numeric(10,2) NOT NULL DEFAULT 0,
  donor_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review','active','paused','completed','rejected')),
  rejection_reason text,
  stripe_payment_link_id text,
  stripe_payment_link_url text,
  cover_image_url text,
  end_date date,
  is_featured boolean NOT NULL DEFAULT false,
  navigator_task_id uuid,
  reviewed_by uuid REFERENCES staff(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS campaign_donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES member_campaigns(id) ON DELETE CASCADE,
  donor_member_id uuid REFERENCES members(id),
  donor_name text,
  donor_email text,
  amount numeric(10,2) NOT NULL CHECK (amount > 0),
  stripe_payment_intent_id text UNIQUE,
  stripe_charge_id text,
  message text,
  is_anonymous boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION trg_campaign_totals_fn()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE member_campaigns SET
    raised_amount = (SELECT COALESCE(SUM(amount),0) FROM campaign_donations WHERE campaign_id = NEW.campaign_id),
    donor_count   = (SELECT COUNT(*) FROM campaign_donations WHERE campaign_id = NEW.campaign_id),
    updated_at    = now()
  WHERE id = NEW.campaign_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_campaign_totals ON campaign_donations;
CREATE TRIGGER trg_campaign_totals
  AFTER INSERT ON campaign_donations
  FOR EACH ROW EXECUTE FUNCTION trg_campaign_totals_fn();

CREATE INDEX IF NOT EXISTS idx_member_campaigns_member ON member_campaigns(member_id);
CREATE INDEX IF NOT EXISTS idx_member_campaigns_status ON member_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaign_donations_campaign ON campaign_donations(campaign_id);
