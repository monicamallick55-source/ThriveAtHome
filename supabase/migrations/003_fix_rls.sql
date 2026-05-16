-- ThriveAtHome — Fix RLS Recursion (Migration 003)
-- The "family_select_linked_members" policy on family_members queries the
-- family_members table from within a policy on family_members, causing infinite
-- recursion. Fix: use a SECURITY DEFINER function that bypasses RLS to get the
-- set of member_ids for the current user, then use that in the policy.

-- Step 1: helper function (runs with owner privileges, bypassing RLS on family_members)
CREATE OR REPLACE FUNCTION get_member_ids_for_auth_user()
RETURNS uuid[]
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT ARRAY_AGG(DISTINCT member_id)
  FROM family_members
  WHERE supabase_auth_id = auth.uid()
  AND member_id IS NOT NULL
$$;

-- Step 2: drop the recursive policy
DROP POLICY IF EXISTS "family_select_linked_members" ON family_members;

-- Step 3: replace with non-recursive version
CREATE POLICY "family_select_linked_members" ON family_members FOR SELECT
USING (member_id = ANY(get_member_ids_for_auth_user()));
