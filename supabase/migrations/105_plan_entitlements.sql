-- 105_plan_entitlements.sql
-- G5.7 — Plan tiers, add-on SKUs, member plan assignments, navigator time logs

-- ────────────────────────────────────────────────
-- 1. Plan tiers
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS plans (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at       timestamptz DEFAULT now() NOT NULL,
  updated_at       timestamptz DEFAULT now() NOT NULL,
  name             text NOT NULL UNIQUE,          -- 'Essential', 'Standard', 'Premium'
  slug             text NOT NULL UNIQUE,          -- 'essential', 'standard', 'premium'
  description      text,
  price_cents      integer NOT NULL DEFAULT 0,    -- monthly price in cents
  billing_interval text NOT NULL DEFAULT 'month'
                     CHECK (billing_interval IN ('month', 'year')),
  is_active        boolean NOT NULL DEFAULT true,
  sort_order       integer NOT NULL DEFAULT 0,
  -- Feature entitlements (boolean flags + numeric limits)
  entitlements     jsonb NOT NULL DEFAULT '{}'
);

ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone can read active plans" ON plans;
CREATE POLICY "anyone can read active plans"
  ON plans FOR SELECT
  USING (is_active OR is_staff());

DROP POLICY IF EXISTS "staff manages plans" ON plans;
CREATE POLICY "staff manages plans"
  ON plans FOR ALL
  USING (is_staff())
  WITH CHECK (is_staff());

-- ────────────────────────────────────────────────
-- 2. Add-on SKUs
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS addon_skus (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at       timestamptz DEFAULT now() NOT NULL,
  name             text NOT NULL UNIQUE,
  slug             text NOT NULL UNIQUE,
  description      text,
  price_cents      integer NOT NULL DEFAULT 0,
  billing_interval text NOT NULL DEFAULT 'month'
                     CHECK (billing_interval IN ('month', 'year', 'one_time')),
  category         text NOT NULL DEFAULT 'service'
                     CHECK (category IN ('service','device','companion','wellness','transport')),
  is_active        boolean NOT NULL DEFAULT true,
  requires_plan_slug text,    -- null = available on any plan; or 'standard','premium' etc.
  entitlement_key  text,      -- optional: adds a boolean key to member entitlements when purchased
  sort_order       integer NOT NULL DEFAULT 0
);

ALTER TABLE addon_skus ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone can read active addons" ON addon_skus;
CREATE POLICY "anyone can read active addons"
  ON addon_skus FOR SELECT
  USING (is_active OR is_staff());

DROP POLICY IF EXISTS "staff manages addons" ON addon_skus;
CREATE POLICY "staff manages addons"
  ON addon_skus FOR ALL
  USING (is_staff())
  WITH CHECK (is_staff());

-- ────────────────────────────────────────────────
-- 3. Member plan assignments
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS member_plans (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at       timestamptz DEFAULT now() NOT NULL,
  updated_at       timestamptz DEFAULT now() NOT NULL,
  member_id        uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  plan_id          uuid NOT NULL REFERENCES plans(id),
  status           text NOT NULL DEFAULT 'active'
                     CHECK (status IN ('active','paused','cancelled','trial')),
  started_at       timestamptz DEFAULT now() NOT NULL,
  trial_ends_at    timestamptz,
  cancelled_at     timestamptz,
  cancel_reason    text,
  stripe_subscription_id text,
  assigned_by      uuid REFERENCES family_members(id) ON DELETE SET NULL,
  notes            text,
  UNIQUE (member_id, plan_id, status)
);

ALTER TABLE member_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "member sees own plan" ON member_plans;
CREATE POLICY "member sees own plan"
  ON member_plans FOR SELECT
  USING (member_id = ANY(acting_member_ids()));

DROP POLICY IF EXISTS "family sees member plan" ON member_plans;
CREATE POLICY "family sees member plan"
  ON member_plans FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.supabase_auth_id = auth.uid()
        AND fm.member_id = member_plans.member_id
    )
  );

DROP POLICY IF EXISTS "staff sees all member plans" ON member_plans;
CREATE POLICY "staff sees all member plans"
  ON member_plans FOR SELECT
  USING (is_staff());

DROP POLICY IF EXISTS "staff manages member plans" ON member_plans;
CREATE POLICY "staff manages member plans"
  ON member_plans FOR ALL
  USING (is_staff())
  WITH CHECK (is_staff());

-- ────────────────────────────────────────────────
-- 4. Member add-on subscriptions
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS member_addons (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at       timestamptz DEFAULT now() NOT NULL,
  member_id        uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  addon_id         uuid NOT NULL REFERENCES addon_skus(id),
  status           text NOT NULL DEFAULT 'active'
                     CHECK (status IN ('active','cancelled','expired')),
  started_at       timestamptz DEFAULT now() NOT NULL,
  expires_at       timestamptz,
  cancelled_at     timestamptz,
  stripe_subscription_id text,
  assigned_by      uuid REFERENCES family_members(id) ON DELETE SET NULL,
  UNIQUE (member_id, addon_id, status)
);

ALTER TABLE member_addons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "member sees own addons" ON member_addons;
CREATE POLICY "member sees own addons"
  ON member_addons FOR SELECT
  USING (member_id = ANY(acting_member_ids()));

DROP POLICY IF EXISTS "family sees member addons" ON member_addons;
CREATE POLICY "family sees member addons"
  ON member_addons FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.supabase_auth_id = auth.uid()
        AND fm.member_id = member_addons.member_id
    )
  );

DROP POLICY IF EXISTS "staff manages member addons" ON member_addons;
CREATE POLICY "staff manages member addons"
  ON member_addons FOR ALL
  USING (is_staff())
  WITH CHECK (is_staff());

-- ────────────────────────────────────────────────
-- 5. Navigator time logs
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS navigator_time_logs (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at       timestamptz DEFAULT now() NOT NULL,
  updated_at       timestamptz DEFAULT now() NOT NULL,
  navigator_id     uuid NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  member_id        uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  logged_at        timestamptz DEFAULT now() NOT NULL,
  duration_minutes integer NOT NULL CHECK (duration_minutes > 0),
  activity_type    text NOT NULL DEFAULT 'check_in'
                     CHECK (activity_type IN (
                       'check_in','care_coordination','family_update',
                       'crisis_support','event_support','admin','ride_coordination',
                       'health_followup','other'
                     )),
  notes            text,
  billable         boolean NOT NULL DEFAULT true,
  approved         boolean NOT NULL DEFAULT false,
  approved_by      uuid REFERENCES family_members(id) ON DELETE SET NULL,
  approved_at      timestamptz
);

ALTER TABLE navigator_time_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "navigator sees own time logs" ON navigator_time_logs;
CREATE POLICY "navigator sees own time logs"
  ON navigator_time_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.id = navigator_time_logs.navigator_id
        AND fm.supabase_auth_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "staff sees all time logs" ON navigator_time_logs;
CREATE POLICY "staff sees all time logs"
  ON navigator_time_logs FOR SELECT
  USING (is_staff());

DROP POLICY IF EXISTS "navigator inserts own time logs" ON navigator_time_logs;
CREATE POLICY "navigator inserts own time logs"
  ON navigator_time_logs FOR INSERT
  WITH CHECK (
    is_staff()
    OR EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.id = navigator_time_logs.navigator_id
        AND fm.supabase_auth_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "staff updates time logs" ON navigator_time_logs;
CREATE POLICY "staff updates time logs"
  ON navigator_time_logs FOR UPDATE
  USING (is_staff());

-- ────────────────────────────────────────────────
-- 6. Seed default plans
-- ────────────────────────────────────────────────
INSERT INTO plans (name, slug, description, price_cents, sort_order, entitlements)
VALUES
  (
    'Essential', 'essential',
    'Core safety and daily check-ins for independent seniors.',
    2999, 1,
    '{
      "daily_checkins": true,
      "safety_alerts": true,
      "navigator_calls_per_month": 2,
      "buddy_connections": 1,
      "circle_memberships": 2,
      "family_summaries": true,
      "ride_bookings": false,
      "life_transitions": false,
      "volunteer_hours": false
    }'
  ),
  (
    'Standard', 'standard',
    'Full connection with social circles, buddies, and family updates.',
    4999, 2,
    '{
      "daily_checkins": true,
      "safety_alerts": true,
      "navigator_calls_per_month": 4,
      "buddy_connections": 3,
      "circle_memberships": 5,
      "family_summaries": true,
      "ride_bookings": true,
      "life_transitions": true,
      "volunteer_hours": true
    }'
  ),
  (
    'Premium', 'premium',
    'Unlimited access with priority navigator support and all features.',
    7999, 3,
    '{
      "daily_checkins": true,
      "safety_alerts": true,
      "navigator_calls_per_month": -1,
      "buddy_connections": -1,
      "circle_memberships": -1,
      "family_summaries": true,
      "ride_bookings": true,
      "life_transitions": true,
      "volunteer_hours": true,
      "priority_navigator": true,
      "concierge_support": true
    }'
  )
ON CONFLICT (slug) DO NOTHING;

-- ────────────────────────────────────────────────
-- 7. Seed default add-on SKUs
-- ────────────────────────────────────────────────
INSERT INTO addon_skus (name, slug, description, price_cents, billing_interval, category, sort_order, entitlement_key)
VALUES
  ('Companion Calls', 'companion-calls', '4 additional 30-min companion calls per month.', 1999, 'month', 'companion', 1, 'companion_calls'),
  ('Ride Credits', 'ride-credits', '4 round-trip ride bookings per month.', 2499, 'month', 'transport', 2, 'ride_credits'),
  ('Medication Reminders', 'medication-reminders', 'Daily SMS medication reminders for member + family.', 999, 'month', 'wellness', 3, 'medication_reminders'),
  ('Fall Detection Device', 'fall-detection', 'Monthly lease of wearable fall detection sensor.', 1499, 'month', 'device', 4, 'fall_detection'),
  ('Life Transitions Support', 'life-transitions', 'Dedicated navigator support for major life changes.', 3999, 'month', 'service', 5, 'life_transitions'),
  ('Family Video Check-ins', 'family-video', '4 scheduled family video calls per month facilitated by navigator.', 1499, 'month', 'service', 6, 'family_video'),
  ('Wellness Assessment', 'wellness-assessment', 'Annual comprehensive wellness assessment by care team.', 9900, 'one_time', 'wellness', 7, null)
ON CONFLICT (slug) DO NOTHING;

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_plans_updated_at ON plans;
CREATE TRIGGER set_plans_updated_at
  BEFORE UPDATE ON plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_member_plans_updated_at ON member_plans;
CREATE TRIGGER set_member_plans_updated_at
  BEFORE UPDATE ON member_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_time_logs_updated_at ON navigator_time_logs;
CREATE TRIGGER set_time_logs_updated_at
  BEFORE UPDATE ON navigator_time_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
