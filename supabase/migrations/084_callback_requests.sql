-- Callback requests: member asks Aria to call them back (via inbound call or dashboard)
CREATE TABLE IF NOT EXISTS callback_requests (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at      timestamptz DEFAULT now() NOT NULL,
  member_id       uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  requested_via   text NOT NULL DEFAULT 'dashboard'
    CHECK (requested_via IN ('dashboard','inbound_call','schedule')),
  preferred_time  timestamptz,
  notes           text,
  status          text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','triggered','completed','cancelled')),
  triggered_at    timestamptz,
  call_id         text
);

ALTER TABLE callback_requests ENABLE ROW LEVEL SECURITY;

-- Members can see their own callback requests (via direct auth)
CREATE POLICY "members_own_callback_requests"
  ON callback_requests FOR ALL
  USING (
    member_id IN (
      SELECT id FROM members WHERE supabase_auth_id = auth.uid()
    )
  );

-- Family members can see their member's callback requests
CREATE POLICY "family_can_read_callback_requests"
  ON callback_requests FOR SELECT
  USING (
    member_id IN (
      SELECT member_id FROM family_members WHERE supabase_auth_id = auth.uid()
    )
  );

CREATE INDEX idx_callback_requests_pending
  ON callback_requests(status, preferred_time)
  WHERE status = 'pending';

CREATE INDEX idx_callback_requests_member
  ON callback_requests(member_id, created_at DESC);
