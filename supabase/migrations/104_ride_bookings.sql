-- 104_ride_bookings.sql
-- G5.8 — Event ride booking requests + family daily summary log

-- ────────────────────────────────────────────────
-- 1. Ride booking requests
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ride_bookings (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at       timestamptz DEFAULT now() NOT NULL,
  updated_at       timestamptz DEFAULT now() NOT NULL,
  member_id        uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  event_id         uuid REFERENCES events(id) ON DELETE SET NULL,
  requested_by     uuid REFERENCES family_members(id) ON DELETE SET NULL,
  pickup_address   text,
  dropoff_address  text,
  pickup_time      timestamptz,
  notes            text,
  status           text NOT NULL DEFAULT 'requested'
                     CHECK (status IN ('requested','confirmed','en_route','completed','cancelled')),
  driver_name      text,
  driver_phone     text,
  confirmed_at     timestamptz,
  cancelled_at     timestamptz,
  cancel_reason    text
);

ALTER TABLE ride_bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "member sees own ride bookings" ON ride_bookings;
CREATE POLICY "member sees own ride bookings"
  ON ride_bookings FOR SELECT
  USING (member_id = ANY(acting_member_ids()));

DROP POLICY IF EXISTS "family member sees own requests" ON ride_bookings;
CREATE POLICY "family member sees own requests"
  ON ride_bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.id = ride_bookings.requested_by
        AND fm.supabase_auth_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "staff sees all ride bookings" ON ride_bookings;
CREATE POLICY "staff sees all ride bookings"
  ON ride_bookings FOR SELECT
  USING (is_staff());

DROP POLICY IF EXISTS "family member can request ride" ON ride_bookings;
CREATE POLICY "family member can request ride"
  ON ride_bookings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.supabase_auth_id = auth.uid()
        AND fm.member_id = ride_bookings.member_id
    )
    OR is_staff()
  );

DROP POLICY IF EXISTS "staff can update ride bookings" ON ride_bookings;
CREATE POLICY "staff can update ride bookings"
  ON ride_bookings FOR UPDATE
  USING (is_staff());

DROP POLICY IF EXISTS "requester can cancel ride" ON ride_bookings;
CREATE POLICY "requester can cancel ride"
  ON ride_bookings FOR UPDATE
  USING (
    status IN ('requested','confirmed')
    AND (
      EXISTS (
        SELECT 1 FROM family_members fm
        WHERE fm.id = ride_bookings.requested_by
          AND fm.supabase_auth_id = auth.uid()
      )
      OR member_id = ANY(acting_member_ids())
    )
  );

-- ────────────────────────────────────────────────
-- 2. Family daily summary log (tracks what was sent)
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS family_summary_log (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at  timestamptz DEFAULT now() NOT NULL,
  member_id   uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  sent_at     timestamptz DEFAULT now() NOT NULL,
  summary_date date NOT NULL,
  channel     text NOT NULL DEFAULT 'sms' CHECK (channel IN ('sms','email','in_app')),
  recipient   text,          -- phone or email sent to
  body        text NOT NULL,
  status      text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent','failed','skipped')),
  error       text,
  UNIQUE (member_id, summary_date, channel)
);

ALTER TABLE family_summary_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff sees summary log" ON family_summary_log;
CREATE POLICY "staff sees summary log"
  ON family_summary_log FOR SELECT
  USING (is_staff());

DROP POLICY IF EXISTS "staff inserts summary log" ON family_summary_log;
CREATE POLICY "staff inserts summary log"
  ON family_summary_log FOR INSERT
  WITH CHECK (is_staff());

-- ────────────────────────────────────────────────
-- 3. Updated_at trigger for ride_bookings
-- ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_ride_bookings_updated_at ON ride_bookings;
CREATE TRIGGER set_ride_bookings_updated_at
  BEFORE UPDATE ON ride_bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
