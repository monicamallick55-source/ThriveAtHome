-- ============================================================
-- ThriveAtHome — Combined Migration Script
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- Applies all 5 pending migrations in order
-- ============================================================

BEGIN;

-- ============================================================
-- MIGRATION 1: Organizations & B2B Tables
-- ============================================================

CREATE TABLE IF NOT EXISTS organizations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,
  plan          TEXT NOT NULL DEFAULT 'b2b_standard' CHECK (plan IN ('b2b_standard', 'b2b_premium', 'b2b_enterprise')),
  member_limit  INT NOT NULL DEFAULT 50,
  enrolled      INT NOT NULL DEFAULT 0,
  contact_email TEXT,
  contact_name  TEXT,
  phone         TEXT,
  address       TEXT,
  city          TEXT,
  state         TEXT,
  zip           TEXT,
  org_type      TEXT CHECK (org_type IN ('home_care_agency','senior_center','employer','housing_community','other')),
  stripe_customer_id TEXT,
  stripe_payment_intent_id TEXT,
  active        BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS org_members (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role          TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin','care_coordinator','member')),
  member_id     UUID REFERENCES members(id),
  invited_by    UUID REFERENCES auth.users(id),
  joined_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, user_id)
);

CREATE TABLE IF NOT EXISTS b2b_platform_config (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  aria_persona  TEXT NOT NULL DEFAULT 'aria',
  branding_name TEXT,
  primary_color TEXT,
  logo_url      TEXT,
  welcome_msg   TEXT,
  features      JSONB NOT NULL DEFAULT '{"volunteer_matching":true,"family_portal":true,"fraud_protection":false,"care_navigator":false}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON org_members(org_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON org_members(user_id);

-- ============================================================
-- MIGRATION 2: Notification Queue (SMS)
-- ============================================================

CREATE TABLE IF NOT EXISTS notification_queue (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id     UUID REFERENCES members(id) ON DELETE CASCADE,
  phone         TEXT NOT NULL,
  message       TEXT NOT NULL,
  type          TEXT NOT NULL DEFAULT 'sms' CHECK (type IN ('sms','push')),
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed','cancelled')),
  priority      INT NOT NULL DEFAULT 5,
  send_after    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at       TIMESTAMPTZ,
  error         TEXT,
  metadata      JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_queue_pending
  ON notification_queue(status, send_after)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_notification_queue_member
  ON notification_queue(member_id);

-- ============================================================
-- MIGRATION 3: Fraud Detection
-- ============================================================

CREATE TABLE IF NOT EXISTS fraud_cases (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id         UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  case_ref          TEXT UNIQUE NOT NULL DEFAULT 'FRAUD-' || upper(substr(gen_random_uuid()::text, 1, 8)),
  alert_type        TEXT NOT NULL CHECK (alert_type IN ('phone_scam','gift_card','lottery','romance','impersonation','other')),
  risk_level        TEXT NOT NULL DEFAULT 'medium' CHECK (risk_level IN ('low','medium','high')),
  detected_during   TEXT,
  details           TEXT,
  recommended_action TEXT,
  status            TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','investigating','resolved','false_positive')),
  resolved_at       TIMESTAMPTZ,
  resolution_notes  TEXT,
  family_notified   BOOLEAN NOT NULL DEFAULT false,
  navigator_notified BOOLEAN NOT NULL DEFAULT false,
  call_id           UUID,
  metadata          JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fraud_cases_member ON fraud_cases(member_id);
CREATE INDEX IF NOT EXISTS idx_fraud_cases_status ON fraud_cases(status);

-- ============================================================
-- MIGRATION 4: Gift & Celebrations
-- ============================================================

CREATE TABLE IF NOT EXISTS gifts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_user_id  UUID NOT NULL REFERENCES auth.users(id),
  recipient_member_id UUID REFERENCES members(id),
  recipient_email TEXT,
  gift_type       TEXT NOT NULL CHECK (gift_type IN ('subscription','upgrade','gift_card','care_package')),
  gift_description TEXT NOT NULL,
  message         TEXT,
  occasion        TEXT,
  stripe_payment_intent_id TEXT,
  amount_cents    INT,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','redeemed','cancelled')),
  redeemed_at     TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS member_celebrations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id       UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  celebration_type TEXT NOT NULL CHECK (celebration_type IN ('birthday','anniversary','milestone','holiday','custom')),
  title           TEXT NOT NULL,
  scheduled_date  DATE NOT NULL,
  recurring       BOOLEAN NOT NULL DEFAULT true,
  notes           TEXT,
  family_notify   BOOLEAN NOT NULL DEFAULT true,
  status          TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming','active','completed','cancelled')),
  last_triggered  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gifts_recipient ON gifts(recipient_member_id);
CREATE INDEX IF NOT EXISTS idx_celebrations_date ON member_celebrations(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_celebrations_member ON member_celebrations(member_id);

-- ============================================================
-- MIGRATION 5: ML Analytics & Wellness Scores
-- ============================================================

CREATE TABLE IF NOT EXISTS wellness_scores (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id     UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  score         NUMERIC(3,1) NOT NULL CHECK (score >= 0 AND score <= 10),
  week_of       DATE NOT NULL,
  check_ins_completed INT NOT NULL DEFAULT 0,
  check_ins_missed    INT NOT NULL DEFAULT 0,
  sentiment_avg NUMERIC(3,2),
  engagement_score NUMERIC(3,2),
  flags         TEXT[],
  computed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(member_id, week_of)
);

CREATE TABLE IF NOT EXISTS ml_insights (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id     UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  insight_type  TEXT NOT NULL CHECK (insight_type IN ('isolation_risk','health_decline','fraud_vulnerability','engagement_drop','positive_trend')),
  confidence    NUMERIC(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  summary       TEXT NOT NULL,
  action_recommended TEXT,
  actioned      BOOLEAN NOT NULL DEFAULT false,
  actioned_at   TIMESTAMPTZ,
  expires_at    TIMESTAMPTZ,
  metadata      JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wellness_scores_member_week
  ON wellness_scores(member_id, week_of DESC);

CREATE INDEX IF NOT EXISTS idx_ml_insights_member
  ON ml_insights(member_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ml_insights_active
  ON ml_insights(insight_type, actioned)
  WHERE actioned = false;

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE b2b_platform_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_celebrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE wellness_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_insights ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (used by API routes)
-- Member access: members can read their own records

CREATE POLICY "members_read_own_wellness" ON wellness_scores
  FOR SELECT USING (
    member_id IN (
      SELECT id FROM members WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "members_read_own_fraud_cases" ON fraud_cases
  FOR SELECT USING (
    member_id IN (
      SELECT id FROM members WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "members_read_own_celebrations" ON member_celebrations
  FOR SELECT USING (
    member_id IN (
      SELECT id FROM members WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "members_manage_own_celebrations" ON member_celebrations
  FOR ALL USING (
    member_id IN (
      SELECT id FROM members WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "org_admins_read_org" ON organizations
  FOR SELECT USING (
    id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid() AND role IN ('admin','care_coordinator')
    )
  );

CREATE POLICY "org_members_read_own" ON org_members
  FOR SELECT USING (user_id = auth.uid());

-- ============================================================
-- Updated_at trigger function (reusable)
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER b2b_platform_config_updated_at
  BEFORE UPDATE ON b2b_platform_config
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER fraud_cases_updated_at
  BEFORE UPDATE ON fraud_cases
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;

-- ============================================================
-- Done! 9 tables created with indexes + RLS policies.
-- Verify with: SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
-- ============================================================
