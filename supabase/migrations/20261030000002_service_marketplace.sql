-- Migration: Service Marketplace
-- Professional service provider listings and booking transactions
-- Created: 2026-10-30

-- Service providers (professional backup when no volunteer available)
CREATE TABLE IF NOT EXISTS marketplace_providers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  category        TEXT NOT NULL,  -- e.g. 'transport', 'home_care', 'meals', 'handyman', 'legal', 'health'
  partner_name    TEXT,           -- e.g. 'Lyft', 'CareLinx', 'TaskRabbit'
  description     TEXT,
  logo_url        TEXT,
  service_areas   TEXT[],         -- ZIP codes or state codes
  pricing_model   TEXT CHECK (pricing_model IN ('flat_fee', 'hourly', 'per_service', 'subscription', 'variable')),
  base_price_cents INTEGER,
  currency        TEXT NOT NULL DEFAULT 'usd',
  booking_url     TEXT,
  phone           TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  requires_plan   TEXT CHECK (requires_plan IN ('basics', 'complete', 'premier', 'any')),
  rating          NUMERIC(3,2),
  review_count    INTEGER NOT NULL DEFAULT 0,
  metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Marketplace transactions (member purchases a professional service)
CREATE TABLE IF NOT EXISTS marketplace_transactions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id               UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  provider_id             UUID NOT NULL REFERENCES marketplace_providers(id) ON DELETE RESTRICT,
  service_booking_id      UUID REFERENCES service_bookings(id) ON DELETE SET NULL,

  status                  TEXT NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'canceled', 'refunded')),

  amount_cents            INTEGER NOT NULL,
  currency                TEXT NOT NULL DEFAULT 'usd',

  stripe_payment_intent_id TEXT,
  stripe_charge_id        TEXT,

  scheduled_for           TIMESTAMPTZ,
  completed_at            TIMESTAMPTZ,
  canceled_at             TIMESTAMPTZ,

  member_rating           INTEGER CHECK (member_rating BETWEEN 1 AND 5),
  member_review           TEXT,
  navigator_notes         TEXT,

  metadata                JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Triggers
CREATE OR REPLACE FUNCTION update_marketplace_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_marketplace_providers_updated_at ON marketplace_providers;
CREATE TRIGGER trg_marketplace_providers_updated_at
  BEFORE UPDATE ON marketplace_providers
  FOR EACH ROW EXECUTE FUNCTION update_marketplace_updated_at();

DROP TRIGGER IF EXISTS trg_marketplace_transactions_updated_at ON marketplace_transactions;
CREATE TRIGGER trg_marketplace_transactions_updated_at
  BEFORE UPDATE ON marketplace_transactions
  FOR EACH ROW EXECUTE FUNCTION update_marketplace_updated_at();

-- Update provider rating when a review is submitted
CREATE OR REPLACE FUNCTION refresh_provider_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- Only recalculate when a rating is present
  IF NEW.member_rating IS NULL THEN
    RETURN NEW;
  END IF;

  UPDATE marketplace_providers
  SET
    rating = (
      SELECT ROUND(AVG(member_rating)::NUMERIC, 2)
      FROM marketplace_transactions
      WHERE provider_id = NEW.provider_id AND member_rating IS NOT NULL
    ),
    review_count = (
      SELECT COUNT(*) FROM marketplace_transactions
      WHERE provider_id = NEW.provider_id AND member_rating IS NOT NULL
    )
  WHERE id = NEW.provider_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_refresh_provider_rating ON marketplace_transactions;
CREATE TRIGGER trg_refresh_provider_rating
  AFTER INSERT OR UPDATE OF member_rating ON marketplace_transactions
  FOR EACH ROW
  EXECUTE FUNCTION refresh_provider_rating();

-- RLS
ALTER TABLE marketplace_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active providers"
  ON marketplace_providers FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Members can view own transactions"
  ON marketplace_transactions FOR SELECT
  USING (
    member_id IN (SELECT id FROM members WHERE supabase_auth_id = auth.uid())
  );

CREATE POLICY "Navigators can view all transactions"
  ON marketplace_transactions FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM members WHERE supabase_auth_id = auth.uid() AND role IN ('navigator', 'care_coordinator', 'platform_admin'))
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_marketplace_providers_category    ON marketplace_providers(category);
CREATE INDEX IF NOT EXISTS idx_marketplace_providers_is_active   ON marketplace_providers(is_active);
CREATE INDEX IF NOT EXISTS idx_marketplace_transactions_member   ON marketplace_transactions(member_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_transactions_provider ON marketplace_transactions(provider_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_transactions_status   ON marketplace_transactions(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_transactions_booking  ON marketplace_transactions(service_booking_id);

-- Seed a handful of partner providers
INSERT INTO marketplace_providers (name, category, partner_name, description, pricing_model, requires_plan, is_active)
VALUES
  ('Lyft Health Rides',             'transport',     'Lyft',        'On-demand rides via Lyft Health network',                         'per_service', 'complete', TRUE),
  ('Uber Health',                   'transport',     'Uber',        'HIPAA-compliant medical transportation via Uber Health',          'per_service', 'complete', TRUE),
  ('CareLinx Home Care',            'home_care',     'CareLinx',    'Vetted professional home care aides, hourly or live-in',         'hourly',      'complete', TRUE),
  ('Honor Home Care',               'home_care',     'Honor',       'Tech-enabled professional in-home care',                         'hourly',      'complete', TRUE),
  ('TaskRabbit Handyman',           'home_repair',   'TaskRabbit',  'Vetted handyman and home repair professionals',                   'hourly',      'complete', TRUE),
  ('Angi Home Services',            'home_repair',   'Angi',        'Licensed contractors for repairs, cleaning, and maintenance',     'variable',    'complete', TRUE),
  ('Meals on Wheels Coordination',  'meals',         'MOW',         'Coordinated Meals on Wheels delivery and setup',                  'flat_fee',    'basics',   TRUE),
  ('DoorDash for Seniors',          'meals',         'DoorDash',    'Restaurant meal delivery with senior-friendly checkout',          'per_service', 'complete', TRUE),
  ('ElderCounsel Legal',            'legal',         'ElderCounsel','Estate planning, wills, powers of attorney — senior specialists', 'flat_fee',    'complete', TRUE),
  ('SilverSneakers Fitness',        'health',        'SilverSneakers','Fitness classes and gym access for Medicare beneficiaries',     'subscription','basics',   TRUE),
  ('BrainHQ Cognitive Programs',    'health',        'BrainHQ',     'Evidence-based brain training for memory and cognition',          'subscription','basics',   TRUE),
  ('Rover Pet Care',                'pet_care',      'Rover',       'Dog walking, boarding, and pet sitting',                         'per_service', 'complete', TRUE)
ON CONFLICT DO NOTHING;
