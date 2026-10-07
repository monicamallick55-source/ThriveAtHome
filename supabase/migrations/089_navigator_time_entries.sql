-- G5.7: Navigator time logging
CREATE TABLE IF NOT EXISTS navigator_time_entries (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at   timestamptz DEFAULT now() NOT NULL,
  member_id    uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  navigator_id uuid NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  minutes      integer NOT NULL CHECK (minutes > 0),
  activity     text NOT NULL,
  logged_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_nte_member ON navigator_time_entries(member_id, logged_at);
ALTER TABLE navigator_time_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "nte_staff" ON navigator_time_entries FOR ALL USING (is_staff());
