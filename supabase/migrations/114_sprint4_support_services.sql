-- Migration 114: Sprint 4 — Support & Services Depth
-- G7.15 Facility-move planning workflow
-- G7.16 Therapist/chaplain/grief counselor directory additions
-- G7.21 Trusted advisor paid listings + 988/VITA

-- ── G7.15: Facility-move planning ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS transition_plans (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at       timestamptz DEFAULT now() NOT NULL,
  member_id        uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  navigator_id     uuid REFERENCES family_members(id) ON DELETE SET NULL,
  plan_type        text NOT NULL DEFAULT 'facility_move'
                   CHECK (plan_type IN ('facility_move','home_modification','downsizing','temporary_care','other')),
  title            text NOT NULL DEFAULT 'Facility Move Plan',
  started_at       timestamptz NOT NULL DEFAULT now(),
  target_date      date,
  status           text NOT NULL DEFAULT 'active'
                   CHECK (status IN ('active','on_hold','completed','cancelled')),
  family_can_see   boolean NOT NULL DEFAULT true,
  notes            text
);

ALTER TABLE transition_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tp_member_read" ON transition_plans FOR SELECT
  USING (member_id = ANY(acting_member_ids()) OR is_staff());
CREATE POLICY "tp_staff_write" ON transition_plans FOR ALL USING (is_staff());
-- Family sees plan when family_can_see=true
CREATE POLICY "tp_family_read" ON transition_plans FOR SELECT
  USING (family_can_see = true AND member_id = ANY(acting_member_ids()));

CREATE TABLE IF NOT EXISTS transition_plan_steps (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at   timestamptz DEFAULT now() NOT NULL,
  plan_id      uuid NOT NULL REFERENCES transition_plans(id) ON DELETE CASCADE,
  step_number  integer NOT NULL,
  week_number  integer NOT NULL DEFAULT 1,
  title        text NOT NULL,
  description  text NOT NULL,
  due_date     date,
  completed_at timestamptz,
  completed_by uuid REFERENCES family_members(id) ON DELETE SET NULL,
  notes        text,
  requires_transport boolean NOT NULL DEFAULT false,
  transport_request_id uuid  -- FK to ride_bookings if exists
);

ALTER TABLE transition_plan_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tps_read" ON transition_plan_steps FOR SELECT
  USING (
    plan_id IN (
      SELECT id FROM transition_plans
      WHERE member_id = ANY(acting_member_ids()) OR is_staff()
    )
  );
CREATE POLICY "tps_staff_write" ON transition_plan_steps FOR ALL USING (is_staff());

-- ── G7.16: Trusted advisor category additions ──────────────────────────────

-- Add columns to trusted_advisors if not already present
ALTER TABLE trusted_advisors
  ADD COLUMN IF NOT EXISTS license_number      text,
  ADD COLUMN IF NOT EXISTS license_state       text,
  ADD COLUMN IF NOT EXISTS telehealth_available boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS non_proselytizing   boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS chaplain_on_request_only boolean NOT NULL DEFAULT true;

-- ── G7.21: Paid advisor listings ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS trusted_advisor_listings (
  id                 uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at         timestamptz DEFAULT now() NOT NULL,
  trusted_advisor_id uuid NOT NULL REFERENCES trusted_advisors(id) ON DELETE CASCADE,
  listing_tier       text NOT NULL CHECK (listing_tier IN ('basic','featured','premier')),
  annual_fee_cents   integer NOT NULL,
  stripe_sub_id      text UNIQUE,
  paid_through_date  date,
  status             text NOT NULL DEFAULT 'pending_approval'
                     CHECK (status IN ('pending_approval','active','expired','cancelled')),
  approved_by        uuid REFERENCES family_members(id) ON DELETE SET NULL,
  approved_at        timestamptz,
  rejection_reason   text
);

ALTER TABLE trusted_advisor_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tal_staff_all" ON trusted_advisor_listings FOR ALL USING (is_staff());
CREATE POLICY "tal_public_read" ON trusted_advisor_listings FOR SELECT
  USING (status = 'active');

-- Tier pricing reference (cents):
-- basic:    240000  ($2,400/yr)
-- featured: 360000  ($3,600/yr)
-- premier:  600000  ($6,000/yr)

-- ── Indexes ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS transition_plans_member_idx ON transition_plans(member_id);
CREATE INDEX IF NOT EXISTS transition_plan_steps_plan_idx ON transition_plan_steps(plan_id, step_number);
CREATE INDEX IF NOT EXISTS tal_advisor_idx ON trusted_advisor_listings(trusted_advisor_id);
CREATE INDEX IF NOT EXISTS tal_status_idx ON trusted_advisor_listings(status);
