-- Add RLS policies for the volunteers table so:
-- 1. Authenticated users can read their own volunteer row (needed by middleware proxy)
-- 2. Service role (admin client) still bypasses RLS for admin operations

-- Allow a volunteer to read their own row (auth.uid() matches supabase_auth_id)
CREATE POLICY "volunteer_can_read_own"
  ON volunteers FOR SELECT
  USING (auth.uid() = supabase_auth_id);

-- Allow a volunteer to update their own row
CREATE POLICY "volunteer_can_update_own"
  ON volunteers FOR UPDATE
  USING (auth.uid() = supabase_auth_id);

-- NOTE: INSERT and DELETE remain admin-only (no policy = denied for non-service-role clients)
-- NOTE: M14+ migrations should use numbers 010+ to avoid conflicts with this file (009)
