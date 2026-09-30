-- Migration 087 — alerts.metadata (Gap Build G1 fix before merge)
-- The Retell welfare-check and service-request tools write structured context
-- (concern type, source, booking id) to alerts.metadata, which never existed, so
-- those alert inserts failed. Existing rows get '{}'.
ALTER TABLE alerts
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN alerts.metadata IS
  'Structured context for the alert, e.g. {"source":"aria_call","concern_type":"fall"}';
