-- Migration 122: B2B org enrollment payment tracking
ALTER TABLE community_orgs
  ADD COLUMN IF NOT EXISTS enrollment_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (enrollment_status IN ('pending','paid','active','suspended','cancelled')),
  ADD COLUMN IF NOT EXISTS enrollment_paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS enrollment_fee_cents INT NOT NULL DEFAULT 330000,
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS org_size TEXT,
  ADD COLUMN IF NOT EXISTS mission_statement TEXT;

CREATE TABLE IF NOT EXISTS org_enrollment_payments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            UUID REFERENCES community_orgs(id) ON DELETE SET NULL,
  stripe_session_id TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  stripe_pi_id      TEXT,
  amount_cents      INT NOT NULL DEFAULT 330000,
  currency          TEXT NOT NULL DEFAULT 'usd',
  status            TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','succeeded','failed','refunded')),
  org_name          TEXT NOT NULL,
  contact_name      TEXT NOT NULL,
  contact_email     TEXT NOT NULL,
  org_type          TEXT NOT NULL,
  metadata          JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at      TIMESTAMPTZ
);
ALTER TABLE org_enrollment_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "platform_admin_enrollment_payments" ON org_enrollment_payments
  FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'platform_admin');
CREATE INDEX IF NOT EXISTS idx_enrollment_payments_session ON org_enrollment_payments(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_payments_org ON org_enrollment_payments(org_id);
