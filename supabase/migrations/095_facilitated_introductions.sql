-- Migration 095 — Facilitated introductions (G2.6)
-- Adds introduced_by + dual-accept columns to member_connections.
-- Both members must independently accept before messaging is enabled.

-- 1. New columns on member_connections
ALTER TABLE member_connections
  ADD COLUMN IF NOT EXISTS introduced_by        uuid REFERENCES family_members(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS requester_accepted   boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS recipient_accepted   boolean NOT NULL DEFAULT false;

-- 2. Index for navigator lookups
CREATE INDEX IF NOT EXISTS idx_mc_introduced_by ON member_connections(introduced_by)
  WHERE introduced_by IS NOT NULL;

-- Comment describes the dual-accept contract:
-- For organic requests (introduced_by IS NULL):
--   requester_accepted = true immediately on insert
--   status flips to 'accepted' when recipient accepts (existing PATCH /api/connections/[id])
-- For navigator introductions (introduced_by IS NOT NULL):
--   Both start false; status stays 'pending' until both flip true
--   The API sets status='accepted' when both are true
