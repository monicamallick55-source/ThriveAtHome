-- 103_birthday_achievements.sql
-- G5.4 — Birthday arc + member achievements
-- 1. Add birth_date to members
-- 2. member_achievements table
-- 3. birthday_messages table (navigator sends birthday cards/messages)

-- ── 1. Birth date on members ──────────────────────────────────────────────────

ALTER TABLE members
  ADD COLUMN IF NOT EXISTS birth_date date,
  ADD COLUMN IF NOT EXISTS birth_date_year_hidden boolean NOT NULL DEFAULT false;

-- ── 2. Member achievements ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS member_achievements (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at      timestamptz DEFAULT now() NOT NULL,
  member_id       uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  achievement_key text NOT NULL,
  title           text NOT NULL,
  description     text,
  icon            text NOT NULL DEFAULT '🏆',
  awarded_at      timestamptz DEFAULT now() NOT NULL,
  UNIQUE (member_id, achievement_key)
);

CREATE INDEX IF NOT EXISTS member_achievements_member_idx ON member_achievements(member_id);

ALTER TABLE member_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "member sees own achievements" ON member_achievements;
CREATE POLICY "member sees own achievements"
  ON member_achievements FOR SELECT
  USING (member_id = ANY(acting_member_ids()));

DROP POLICY IF EXISTS "family sees member achievements" ON member_achievements;
CREATE POLICY "family sees member achievements"
  ON member_achievements FOR SELECT
  USING (
    member_id IN (
      SELECT member_id FROM family_members WHERE supabase_auth_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "staff manages achievements" ON member_achievements;
CREATE POLICY "staff manages achievements"
  ON member_achievements FOR ALL
  USING (is_staff());

-- ── 3. Birthday messages ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS birthday_messages (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at      timestamptz DEFAULT now() NOT NULL,
  member_id       uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  sent_by         uuid REFERENCES family_members(id) ON DELETE SET NULL,
  message         text NOT NULL,
  sent_at         timestamptz DEFAULT now() NOT NULL,
  delivery_method text NOT NULL DEFAULT 'in_app'
                    CHECK (delivery_method IN ('in_app', 'sms', 'email')),
  birthday_year   integer NOT NULL
);

CREATE INDEX IF NOT EXISTS birthday_messages_member_idx ON birthday_messages(member_id);

ALTER TABLE birthday_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "member sees own birthday messages" ON birthday_messages;
CREATE POLICY "member sees own birthday messages"
  ON birthday_messages FOR SELECT
  USING (member_id = ANY(acting_member_ids()));

DROP POLICY IF EXISTS "staff manages birthday messages" ON birthday_messages;
CREATE POLICY "staff manages birthday messages"
  ON birthday_messages FOR ALL
  USING (is_staff());
