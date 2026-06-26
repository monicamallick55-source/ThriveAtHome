-- Migration 052: Add public slug to employer_accounts for /employer/[slug] landing pages

ALTER TABLE employer_accounts
  ADD COLUMN IF NOT EXISTS slug text UNIQUE,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS website_url text,
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS benefit_headline text,
  ADD COLUMN IF NOT EXISTS benefit_description text;

-- Generate slugs from company_name where not set
UPDATE employer_accounts
SET slug = LOWER(REGEXP_REPLACE(TRIM(company_name), '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL;

-- Public read access for employer landing pages (no auth required)
CREATE POLICY "public_read_employer_landing" ON employer_accounts
  FOR SELECT TO anon
  USING (status = 'active');
