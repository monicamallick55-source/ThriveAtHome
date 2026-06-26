-- Phase 67: Direct member login support
-- Adds supabase_auth_id to members table so seniors can log in directly (not via family_members)
-- Run in Supabase SQL Editor

ALTER TABLE members ADD COLUMN IF NOT EXISTS supabase_auth_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;

-- Members can read their own row
DROP POLICY IF EXISTS "member_read_own" ON members;
CREATE POLICY "member_read_own" ON members
  FOR SELECT
  USING (supabase_auth_id = auth.uid());

-- Members can update their own row (preferences, language, etc.)
DROP POLICY IF EXISTS "member_update_own" ON members;
CREATE POLICY "member_update_own" ON members
  FOR UPDATE
  USING (supabase_auth_id = auth.uid())
  WITH CHECK (supabase_auth_id = auth.uid());

-- Test: after running this, do:
--   CREATE AUTH USER margaret@thriveathome.dev in Supabase Auth → copy UUID
--   UPDATE members SET supabase_auth_id = '[UUID]' WHERE full_name = 'Margaret Chen';
--   Log in as margaret@thriveathome.dev → should reach /member-portal
