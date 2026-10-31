-- Migration 120: Service Marketplace
-- Tables: service_partners, service_bookings, marketplace_transactions
-- marketplace_live: false — schema live, activation pending LLC
-- Fixed: profiles→members, role column→jwt app_metadata

DROP TABLE IF EXISTS marketplace_transactions CASCADE;
DROP TABLE IF EXISTS service_bookings CASCADE;
DROP TABLE IF EXISTS service_partners CASCADE;

CREATE TABLE service_partners (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID REFERENCES community_orgs(id) ON DELETE SET NULL,
  name          TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,
  category      TEXT NOT NULL CHECK (category IN (
                  'home_services', 'health_services', 'legal_financial',
                  'tech_help', 'transportation', 'companion', 'other'
                )),
  description   TEXT,
  logo_url      TEXT,
  website_url   TEXT,
  phone         TEXT,
  email         TEXT,
  service_areas TEXT[],
  is_vetted     BOOLEAN NOT NULL DEFAULT false,
  is_active     BOOLEAN NOT NULL DEFAULT false,
  rating        NUMERIC(3,2),
  review_count  INTEGER DEFAULT 0,
  base_rate     NUMERIC(10,2),
  rate_unit     TEXT DEFAULT 'hour' CHECK (rate_unit IN ('hour','flat','visit')),
  stripe_acct   TEXT,
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE service_bookings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id         UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  partner_id        UUID NOT NULL REFERENCES service_partners(id) ON DELETE RESTRICT,
  service_type      TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'requested'
                    CHECK (status IN ('requested','confirmed','in_progress','completed','cancelled')),
  scheduled_at      TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,
  duration_minutes  INTEGER,
  notes             TEXT,
  member_address    TEXT,
  quoted_amount     NUMERIC(10,2),
  final_amount      NUMERIC(10,2),
  navigator_id      UUID REFERENCES members(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE marketplace_transactions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id          UUID NOT NULL REFERENCES service_bookings(id) ON DELETE RESTRICT,
  member_id           UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  partner_id          UUID NOT NULL REFERENCES service_partners(id) ON DELETE RESTRICT,
  stripe_payment_id   TEXT,
  stripe_transfer_id  TEXT,
  gross_amount        NUMERIC(10,2) NOT NULL,
  platform_fee        NUMERIC(10,2) NOT NULL DEFAULT 0,
  partner_payout      NUMERIC(10,2) NOT NULL,
  currency            TEXT NOT NULL DEFAULT 'usd',
  status              TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','captured','transferred','refunded','failed')),
  refund_amount       NUMERIC(10,2),
  refund_reason       TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_service_partners_category  ON service_partners(category);
CREATE INDEX idx_service_partners_is_active ON service_partners(is_active);
CREATE INDEX idx_service_bookings_member    ON service_bookings(member_id);
CREATE INDEX idx_service_bookings_partner   ON service_bookings(partner_id);
CREATE INDEX idx_service_bookings_status    ON service_bookings(status);
CREATE INDEX idx_mktx_booking              ON marketplace_transactions(booking_id);
CREATE INDEX idx_mktx_member               ON marketplace_transactions(member_id);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_service_partners_updated_at
  BEFORE UPDATE ON service_partners FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_service_bookings_updated_at
  BEFORE UPDATE ON service_bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_marketplace_transactions_updated_at
  BEFORE UPDATE ON marketplace_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE service_partners         ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_bookings         ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read active partners" ON service_partners FOR SELECT
  USING (is_active = true AND is_vetted = true);
CREATE POLICY "admin manage partners" ON service_partners FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin','navigator')
      OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin','navigator'));
CREATE POLICY "member own bookings" ON service_bookings FOR ALL
  USING (member_id = auth.uid());
CREATE POLICY "navigator manage bookings" ON service_bookings FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin','navigator')
      OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin','navigator'));
CREATE POLICY "member own transactions" ON marketplace_transactions FOR SELECT
  USING (member_id = auth.uid());
CREATE POLICY "admin manage transactions" ON marketplace_transactions FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin','navigator')
      OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin','navigator'));
