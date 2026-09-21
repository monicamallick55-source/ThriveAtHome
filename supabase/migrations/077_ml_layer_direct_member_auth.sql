-- Migration 077: Allow seniors who signed up directly (members.supabase_auth_id,
-- added in migration 049) to read their own ML wellness intelligence.
--
-- The original policies on these tables (064_m23_ml_layer.sql) only recognized
-- family_members.supabase_auth_id, so a senior with no linked family_members row
-- could never see their own ml/insights data — even though app/api/ml/insights
-- now resolves their member_id correctly via resolveMemberContext.

DROP POLICY IF EXISTS "member_direct_read_own_wellness_baselines" ON wellness_baselines;
CREATE POLICY "member_direct_read_own_wellness_baselines" ON wellness_baselines FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM members m
    WHERE m.id = wellness_baselines.member_id
    AND m.supabase_auth_id = auth.uid()
  ));

DROP POLICY IF EXISTS "member_direct_read_own_behavioral_anomalies" ON behavioral_anomalies;
CREATE POLICY "member_direct_read_own_behavioral_anomalies" ON behavioral_anomalies FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM members m
    WHERE m.id = behavioral_anomalies.member_id
    AND m.supabase_auth_id = auth.uid()
  ));

DROP POLICY IF EXISTS "member_direct_read_own_fall_risk_scores" ON fall_risk_scores;
CREATE POLICY "member_direct_read_own_fall_risk_scores" ON fall_risk_scores FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM members m
    WHERE m.id = fall_risk_scores.member_id
    AND m.supabase_auth_id = auth.uid()
  ));

DROP POLICY IF EXISTS "member_direct_read_own_isolation_scores" ON isolation_scores;
CREATE POLICY "member_direct_read_own_isolation_scores" ON isolation_scores FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM members m
    WHERE m.id = isolation_scores.member_id
    AND m.supabase_auth_id = auth.uid()
  ));

DROP POLICY IF EXISTS "member_direct_read_own_grief_pattern_flags" ON grief_pattern_flags;
CREATE POLICY "member_direct_read_own_grief_pattern_flags" ON grief_pattern_flags FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM members m
    WHERE m.id = grief_pattern_flags.member_id
    AND m.supabase_auth_id = auth.uid()
  ));
