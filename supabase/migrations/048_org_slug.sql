-- Migration 048: Add public slug to community_orgs for public landing pages
ALTER TABLE community_orgs
  ADD COLUMN IF NOT EXISTS slug text;

-- Create unique index (allow nulls)
CREATE UNIQUE INDEX IF NOT EXISTS idx_community_orgs_slug ON community_orgs(slug)
  WHERE slug IS NOT NULL;

-- Backfill existing orgs with a slug derived from org_name
UPDATE community_orgs
SET slug = lower(regexp_replace(
  regexp_replace(trim(org_name), '[^a-zA-Z0-9\s-]', '', 'g'),
  '\s+', '-', 'g'
))
WHERE slug IS NULL AND org_name IS NOT NULL;
