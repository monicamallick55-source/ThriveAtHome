-- Migration: B2B Platform Config
-- Stores per-organization configuration for B2B clients
-- Created: 2026-10-30

CREATE TABLE IF NOT EXISTS b2b_platform_config (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  feature_flags   JSONB NOT NULL DEFAULT '{}'::jsonb,
  branding        JSONB NOT NULL DEFAULT '{}'::jsonb,
  seat_limit      INTEGER,
  contact_email   TEXT,
  billing_email   TEXT,
  contract_start  DATE,
  contract_end    DATE,
  renewal_auto    BOOLEAN NOT NULL DEFAULT TRUE,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id)
);

-- Trigger to keep updated_at current
CREATE OR REPLACE FUNCTION update_b2b_platform_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_b2b_platform_config_updated_at ON b2b_platform_config;
CREATE TRIGGER trg_b2b_platform_config_updated_at
  BEFORE UPDATE ON b2b_platform_config
  FOR EACH ROW EXECUTE FUNCTION update_b2b_platform_config_updated_at();

-- RLS: Org admins can read/write their own config; platform admins can read all
ALTER TABLE b2b_platform_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org admins can manage their config"
  ON b2b_platform_config
  FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid() AND role IN ('org_admin', 'org_owner')
    )
  )
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid() AND role IN ('org_admin', 'org_owner')
    )
  );

CREATE POLICY "Platform admins can read all configs"
  ON b2b_platform_config
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE auth_id = auth.uid() AND role = 'platform_admin'
    )
  );

CREATE INDEX IF NOT EXISTS idx_b2b_platform_config_org_id ON b2b_platform_config(org_id);
