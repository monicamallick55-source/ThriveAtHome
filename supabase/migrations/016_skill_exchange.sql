-- Migration 016: Skill Exchange / Time Banking (Phase 36)

CREATE TABLE skills_offered (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at      timestamptz DEFAULT now() NOT NULL,
  member_id       uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  skill_name      text NOT NULL,
  skill_category  text NOT NULL DEFAULT 'other',
  description     text NOT NULL,
  delivery_method text NOT NULL DEFAULT 'phone',
  max_group_size  int NOT NULL DEFAULT 1,
  is_active       boolean NOT NULL DEFAULT true
);
ALTER TABLE skills_offered ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_read_skills" ON skills_offered FOR SELECT TO authenticated USING (true);
CREATE POLICY "family_manage_own_skills" ON skills_offered FOR ALL
USING (EXISTS (SELECT 1 FROM family_members fm WHERE fm.member_id = skills_offered.member_id AND fm.supabase_auth_id = auth.uid()));

CREATE TABLE time_credits (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id        uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE UNIQUE,
  balance          numeric NOT NULL DEFAULT 0,
  lifetime_earned  numeric NOT NULL DEFAULT 0,
  lifetime_spent   numeric NOT NULL DEFAULT 0
);
ALTER TABLE time_credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "member_own_credits" ON time_credits FOR ALL
USING (EXISTS (SELECT 1 FROM family_members fm WHERE fm.member_id = time_credits.member_id AND fm.supabase_auth_id = auth.uid()));

CREATE TABLE skill_exchanges (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at          timestamptz DEFAULT now() NOT NULL,
  teacher_member_id   uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  learner_member_id   uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  skill_id            uuid NOT NULL REFERENCES skills_offered(id) ON DELETE CASCADE,
  scheduled_date      timestamptz,
  duration_hours      numeric NOT NULL DEFAULT 1,
  status              text NOT NULL DEFAULT 'scheduled',
  teacher_rating      int CHECK (teacher_rating BETWEEN 1 AND 5),
  learner_rating      int CHECK (learner_rating BETWEEN 1 AND 5),
  credits_transferred numeric
);
ALTER TABLE skill_exchanges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family_see_own_exchanges" ON skill_exchanges FOR SELECT
USING (EXISTS (
  SELECT 1 FROM family_members fm
  WHERE fm.supabase_auth_id = auth.uid()
    AND (fm.member_id = skill_exchanges.teacher_member_id OR fm.member_id = skill_exchanges.learner_member_id)
));
CREATE POLICY "family_create_exchanges" ON skill_exchanges FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM family_members fm WHERE fm.member_id = skill_exchanges.learner_member_id AND fm.supabase_auth_id = auth.uid()));

CREATE TABLE time_credit_transactions (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at  timestamptz DEFAULT now() NOT NULL,
  member_id   uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  amount      numeric NOT NULL,
  type        text NOT NULL,
  exchange_id uuid REFERENCES skill_exchanges(id) ON DELETE SET NULL,
  description text NOT NULL
);
ALTER TABLE time_credit_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "member_own_transactions" ON time_credit_transactions FOR SELECT
USING (EXISTS (SELECT 1 FROM family_members fm WHERE fm.member_id = time_credit_transactions.member_id AND fm.supabase_auth_id = auth.uid()));
