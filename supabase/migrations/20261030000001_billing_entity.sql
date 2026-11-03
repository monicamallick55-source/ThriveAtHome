-- Migration: Billing Entity
-- Normalises billing across B2C (individual member) and B2B (organization) subscriptions
-- Created: 2026-10-30

CREATE TABLE IF NOT EXISTS billing_entities (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type             TEXT NOT NULL CHECK (entity_type IN ('member', 'organization')),
  member_id               UUID REFERENCES members(id) ON DELETE SET NULL,
  org_id                  UUID REFERENCES organizations(id) ON DELETE SET NULL,

  stripe_customer_id      TEXT UNIQUE,
  stripe_subscription_id  TEXT UNIQUE,
  stripe_price_id         TEXT,

  plan                    TEXT CHECK (plan IN ('basics', 'complete', 'premier', 'b2b_standard', 'b2b_premium')),
  billing_cycle           TEXT CHECK (billing_cycle IN ('monthly', 'annual', 'contract')),
  subscription_status     TEXT NOT NULL DEFAULT 'inactive'
                            CHECK (subscription_status IN ('active', 'inactive', 'past_due', 'canceled', 'trialing', 'paused')),

  current_period_start    TIMESTAMPTZ,
  current_period_end      TIMESTAMPTZ,
  trial_end               TIMESTAMPTZ,
  canceled_at             TIMESTAMPTZ,

  amount_cents            INTEGER,  -- last known invoice amount
  currency                TEXT NOT NULL DEFAULT 'usd',

  metadata                JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT entity_ref_check CHECK (
    (entity_type = 'member'       AND member_id IS NOT NULL AND org_id IS NULL) OR
    (entity_type = 'organization' AND org_id IS NOT NULL    AND member_id IS NULL)
  )
);

CREATE OR REPLACE FUNCTION update_billing_entities_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_billing_entities_updated_at ON billing_entities;
CREATE TRIGGER trg_billing_entities_updated_at
  BEFORE UPDATE ON billing_entities
  FOR EACH ROW EXECUTE FUNCTION update_billing_entities_updated_at();

ALTER TABLE billing_entities ENABLE ROW LEVEL SECURITY;

-- Members can read their own billing entity
CREATE POLICY "Members can read own billing"
  ON billing_entities FOR SELECT
  USING (
    member_id IN (
      SELECT id FROM members WHERE supabase_auth_id = auth.uid()
    )
  );

-- Platform admins can read/write all
CREATE POLICY "Platform admins full access"
  ON billing_entities FOR ALL
  USING (
    EXISTS (SELECT 1 FROM members WHERE supabase_auth_id = auth.uid() AND role = 'platform_admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM members WHERE supabase_auth_id = auth.uid() AND role = 'platform_admin')
  );

-- Indexes for Stripe webhook lookups
CREATE INDEX IF NOT EXISTS idx_billing_entities_stripe_customer    ON billing_entities(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_billing_entities_stripe_subscription ON billing_entities(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_billing_entities_member_id           ON billing_entities(member_id);
CREATE INDEX IF NOT EXISTS idx_billing_entities_org_id              ON billing_entities(org_id);
CREATE INDEX IF NOT EXISTS idx_billing_entities_status              ON billing_entities(subscription_status);
