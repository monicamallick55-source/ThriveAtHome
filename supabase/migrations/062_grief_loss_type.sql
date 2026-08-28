-- Migration 062: Grief Welcome Path — capture who the member lost
-- Optional personalisation field used when inviting the member to a grief circle.
-- Run in Supabase SQL Editor.

ALTER TABLE members
  ADD COLUMN IF NOT EXISTS grief_loss_type text;
-- Expected values: partner_spouse, parent, sibling, close_friend, other (free text tolerated)
