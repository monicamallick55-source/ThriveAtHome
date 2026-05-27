-- Add in-person location and platform-wide visibility to circle_events
ALTER TABLE circle_events
  ADD COLUMN IF NOT EXISTS location_address text,
  ADD COLUMN IF NOT EXISTS is_platform_wide boolean NOT NULL DEFAULT false;

-- Policy: authenticated users can read platform-wide events without circle membership
CREATE POLICY IF NOT EXISTS "authenticated_can_read_platform_events"
  ON circle_events
  FOR SELECT
  TO authenticated
  USING (is_platform_wide = true);
