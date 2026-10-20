-- Migration 112: G7.2 + G7.3 + G7.4 — Family Events Calendar, Gift Orders, Celebrations
-- Covers: family_events, gift_orders, celebration_requests, celebration_messages

-- ── family_events ─────────────────────────────────────────────────────────────
-- Family members record events for their senior (birthdays, anniversaries, etc.)
-- Aria gets context 7 days out and day-of; notifications fire to family

CREATE TABLE IF NOT EXISTS family_events (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at     timestamptz DEFAULT now() NOT NULL,
  member_id      uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  created_by     uuid NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  event_type     text NOT NULL CHECK (event_type IN (
                   'birthday','anniversary','holiday','milestone',
                   'graduation','homecoming','other'
                 )),
  title          text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
  event_date     date NOT NULL,
  recurring      boolean NOT NULL DEFAULT false,
  notes          text,
  aria_notified_7d  boolean NOT NULL DEFAULT false,
  aria_notified_1d  boolean NOT NULL DEFAULT false,
  family_notified   boolean NOT NULL DEFAULT false,
  cancelled_at   timestamptz
);

CREATE INDEX IF NOT EXISTS family_events_member_id_idx ON family_events(member_id);
CREATE INDEX IF NOT EXISTS family_events_event_date_idx ON family_events(event_date);
CREATE INDEX IF NOT EXISTS family_events_upcoming_idx
  ON family_events(member_id, event_date)
  WHERE cancelled_at IS NULL;

ALTER TABLE family_events ENABLE ROW LEVEL SECURITY;

-- Member can read their own events
CREATE POLICY "fe_member_read" ON family_events
  FOR SELECT USING (member_id = ANY(acting_member_ids()));

-- Family can read + manage events for their member
CREATE POLICY "fe_family_all" ON family_events
  FOR ALL USING (member_id = ANY(acting_member_ids()));

-- Staff can read all
CREATE POLICY "fe_staff_read" ON family_events
  FOR SELECT USING (is_staff());

-- ── gift_orders ───────────────────────────────────────────────────────────────
-- Senior sends gifts/cards to family members

CREATE TABLE IF NOT EXISTS gift_orders (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at      timestamptz DEFAULT now() NOT NULL,
  member_id       uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  recipient_name  text NOT NULL,
  recipient_email text,
  gift_type       text NOT NULL CHECK (gift_type IN (
                    'greeting_card','flower_bouquet','gift_basket',
                    'photo_book','meal_delivery','donation_in_honor',
                    'amazon_gift_card','book','plant','custom'
                  )),
  gift_label      text NOT NULL,        -- human-readable name from catalog
  amount_cents    integer,              -- null for free/card-only items
  stripe_pi_id    text,                 -- Stripe PaymentIntent id
  message         text,
  status          text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','processing','shipped','delivered','cancelled')),
  tracking_url    text,
  event_id        uuid REFERENCES family_events(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS gift_orders_member_id_idx ON gift_orders(member_id);
CREATE INDEX IF NOT EXISTS gift_orders_status_idx ON gift_orders(status);

ALTER TABLE gift_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "go_member_all" ON gift_orders
  FOR ALL USING (member_id = ANY(acting_member_ids()));

CREATE POLICY "go_staff_read" ON gift_orders
  FOR SELECT USING (is_staff());

-- ── celebration_requests ──────────────────────────────────────────────────────
-- Family organises a celebration for their senior (3 tiers)

CREATE TABLE IF NOT EXISTS celebration_requests (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at      timestamptz DEFAULT now() NOT NULL,
  member_id       uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  requested_by    uuid NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  event_id        uuid REFERENCES family_events(id) ON DELETE SET NULL,
  tier            text NOT NULL CHECK (tier IN ('basic','enhanced','premium')),
  -- basic=$0 (digital card + Aria shout-out)
  -- enhanced=$25 (+ physical card + gift)
  -- premium=$75 (+ printed photo book + personal note from care team)
  amount_cents    integer NOT NULL DEFAULT 0,
  stripe_pi_id    text,
  status          text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','paid','in_review','active','completed','cancelled')),
  celebration_date date NOT NULL,
  special_message  text,
  grief_hold       boolean NOT NULL DEFAULT false,   -- navigator can hold if grief concern
  navigator_note   text,
  completed_at     timestamptz
);

CREATE INDEX IF NOT EXISTS celebration_requests_member_id_idx ON celebration_requests(member_id);
CREATE INDEX IF NOT EXISTS celebration_requests_date_idx ON celebration_requests(celebration_date);

ALTER TABLE celebration_requests ENABLE ROW LEVEL SECURITY;

-- Family can create + see their own requests
CREATE POLICY "cr_family_all" ON celebration_requests
  FOR ALL USING (
    member_id = ANY(acting_member_ids()) AND
    requested_by IN (
      SELECT id FROM family_members WHERE supabase_auth_id = auth.uid()
    )
  );

-- Staff can see + update all
CREATE POLICY "cr_staff_all" ON celebration_requests
  FOR ALL USING (is_staff());

-- ── celebration_messages ──────────────────────────────────────────────────────
-- Family coordination messages (not visible to senior)

CREATE TABLE IF NOT EXISTS celebration_messages (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at       timestamptz DEFAULT now() NOT NULL,
  celebration_id   uuid NOT NULL REFERENCES celebration_requests(id) ON DELETE CASCADE,
  sender_id        uuid NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  content          text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  is_staff_message boolean NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS cm_celebration_id_idx ON celebration_messages(celebration_id);

ALTER TABLE celebration_messages ENABLE ROW LEVEL SECURITY;

-- Family can read + write messages for celebrations they're part of
CREATE POLICY "cm_family_all" ON celebration_messages
  FOR ALL USING (
    celebration_id IN (
      SELECT id FROM celebration_requests
      WHERE member_id = ANY(acting_member_ids())
    )
  );

-- Staff can read + write all
CREATE POLICY "cm_staff_all" ON celebration_messages
  FOR ALL USING (is_staff());
