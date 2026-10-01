-- Migration 086 — Grace reminder calls (Gap Build G1.6)
-- Members can ask for a phone reminder from Grace the day before a tracked item is due.
ALTER TABLE tracked_items
  ADD COLUMN IF NOT EXISTS call_reminder boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN tracked_items.call_reminder IS
  'true → Grace (voice agent) calls the member the day before, if they have opted in to Aria calls';
