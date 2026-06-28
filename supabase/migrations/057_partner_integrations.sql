-- Migration 057: Partner Integrations — Helpful Village + Mon Ami + Org Plan Tiers (Phase 73)
-- Adds integration fields and plan tier to community_orgs table

ALTER TABLE community_orgs
  ADD COLUMN IF NOT EXISTS helpful_village_org_id text,
  ADD COLUMN IF NOT EXISTS hv_sync_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS mon_ami_integration boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS org_api_key text UNIQUE,
  ADD COLUMN IF NOT EXISTS plan_tier text NOT NULL DEFAULT 'in_development';
  -- in_development ($49/mo), growth ($149/mo), scale ($349/mo), trial (30-day free)

-- Generate API keys for existing orgs (used for /api/v1/org/members endpoint)
UPDATE community_orgs
SET org_api_key = 'org_' || encode(gen_random_bytes(24), 'hex')
WHERE org_api_key IS NULL;
