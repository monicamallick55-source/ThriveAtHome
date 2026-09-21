-- Migration 078: Allow seniors who signed up directly (members.supabase_auth_id,
-- added in migration 049) to use Skill Exchange / Time Banking as themselves.
--
-- The original policies on these tables (016_skill_exchange.sql) only recognized
-- family_members.supabase_auth_id, so a direct-auth senior could never register a
-- skill, request/complete an exchange, or see their own time credits — even though
-- app/api/skill-exchange/* now resolves their member_id correctly.

DROP POLICY IF EXISTS "member_direct_manage_own_skills" ON skills_offered;
CREATE POLICY "member_direct_manage_own_skills" ON skills_offered FOR ALL
  USING (EXISTS (
    SELECT 1 FROM members m
    WHERE m.id = skills_offered.member_id
    AND m.supabase_auth_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM members m
    WHERE m.id = skills_offered.member_id
    AND m.supabase_auth_id = auth.uid()
  ));

DROP POLICY IF EXISTS "member_direct_own_credits" ON time_credits;
CREATE POLICY "member_direct_own_credits" ON time_credits FOR ALL
  USING (EXISTS (
    SELECT 1 FROM members m
    WHERE m.id = time_credits.member_id
    AND m.supabase_auth_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM members m
    WHERE m.id = time_credits.member_id
    AND m.supabase_auth_id = auth.uid()
  ));

DROP POLICY IF EXISTS "member_direct_own_transactions" ON time_credit_transactions;
CREATE POLICY "member_direct_own_transactions" ON time_credit_transactions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM members m
    WHERE m.id = time_credit_transactions.member_id
    AND m.supabase_auth_id = auth.uid()
  ));

DROP POLICY IF EXISTS "member_direct_see_own_exchanges" ON skill_exchanges;
CREATE POLICY "member_direct_see_own_exchanges" ON skill_exchanges FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM members m
    WHERE m.supabase_auth_id = auth.uid()
    AND (m.id = skill_exchanges.teacher_member_id OR m.id = skill_exchanges.learner_member_id)
  ));

DROP POLICY IF EXISTS "member_direct_create_exchanges" ON skill_exchanges;
CREATE POLICY "member_direct_create_exchanges" ON skill_exchanges FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM members m
    WHERE m.id = skill_exchanges.learner_member_id
    AND m.supabase_auth_id = auth.uid()
  ));
