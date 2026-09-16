-- Migration 076: Allow seniors who signed up directly (members.supabase_auth_id,
-- added in migration 049) to access their own tracked_items (Important Dates).
--
-- The original policy on tracked_items (031_tracked_items.sql) only recognized
-- family_members.supabase_auth_id, so a senior with no linked family_members row
-- could never save or see their own Important Dates — even though the app-side
-- API routes now resolve their member_id correctly.

DROP POLICY IF EXISTS "member_direct_own_tracked_items" ON tracked_items;

CREATE POLICY "member_direct_own_tracked_items" ON tracked_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM members m
    WHERE m.id = tracked_items.member_id
    AND m.supabase_auth_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM members m
    WHERE m.id = tracked_items.member_id
    AND m.supabase_auth_id = auth.uid()
  ));
