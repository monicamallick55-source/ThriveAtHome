-- G2.5: Friend connections + private messages
CREATE TABLE IF NOT EXISTS member_connections (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at   timestamptz DEFAULT now() NOT NULL,
  requester_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','blocked')),
  intro_note   text CHECK (char_length(intro_note) <= 300),
  responded_at timestamptz,
  CHECK (requester_id <> recipient_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_member_pair ON member_connections
  (LEAST(requester_id, recipient_id), GREATEST(requester_id, recipient_id));
ALTER TABLE member_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mc_parties" ON member_connections FOR ALL USING (
  requester_id = ANY(acting_member_ids()) OR recipient_id = ANY(acting_member_ids()) OR is_staff()
);

CREATE TABLE IF NOT EXISTS private_messages (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at    timestamptz DEFAULT now() NOT NULL,
  connection_id uuid NOT NULL REFERENCES member_connections(id) ON DELETE CASCADE,
  sender_id     uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  content       text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  read_at       timestamptz,
  flagged       boolean NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS idx_pm_conn ON private_messages(connection_id, created_at);
ALTER TABLE private_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pm_parties" ON private_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM member_connections c WHERE c.id = connection_id
          AND (c.requester_id = ANY(acting_member_ids()) OR c.recipient_id = ANY(acting_member_ids())))
);
CREATE POLICY "pm_send_accepted_only" ON private_messages FOR INSERT WITH CHECK (
  sender_id = ANY(acting_member_ids()) AND EXISTS (
    SELECT 1 FROM member_connections c WHERE c.id = connection_id AND c.status = 'accepted'
    AND sender_id IN (c.requester_id, c.recipient_id))
);
ALTER PUBLICATION supabase_realtime ADD TABLE private_messages;
