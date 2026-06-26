-- Phase 54: Partner API keys for enterprise / Medicare Advantage reporting access
-- Each employer account can have one or more API keys for machine-readable outcomes reporting.
-- Keys are managed by admin only. Rate limit: 100 req/key/day. Min cohort: 10 members.

CREATE TABLE partner_api_keys (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at          timestamptz DEFAULT now() NOT NULL,
  employer_account_id uuid NOT NULL REFERENCES employer_accounts(id) ON DELETE CASCADE,
  key_name            text NOT NULL DEFAULT 'Default Key',
  api_key             text NOT NULL UNIQUE,
  is_active           boolean NOT NULL DEFAULT true,
  requests_today      int NOT NULL DEFAULT 0,
  requests_date       date
);
ALTER TABLE partner_api_keys ENABLE ROW LEVEL SECURITY;

-- Admin-only access — keys are created and managed by ThriveAtHome staff via service role
CREATE POLICY "admin_all_partner_api_keys" ON partner_api_keys FOR ALL
  USING (EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.supabase_auth_id = auth.uid() AND fm.role = 'admin'
  ));

-- Seed a test key for Acme Corp so Phase 54 can be verified immediately after migration runs
INSERT INTO partner_api_keys (employer_account_id, key_name, api_key)
SELECT id, 'Test Key (Phase 54 Verification)', 'ent_test_acme_corp_2026_phase54'
FROM employer_accounts
WHERE company_name = 'Acme Corp'
LIMIT 1;
