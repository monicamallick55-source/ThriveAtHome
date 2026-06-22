-- Migration 036: Employer Portal Full Build
-- Adds employer_admin role, employer_account linkage, invitation flow

-- ─── Role enum ────────────────────────────────────────────────────────────────
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'employer_admin';

-- ─── employer_accounts: extra columns for utilisation dashboard ───────────────
ALTER TABLE employer_accounts
  ADD COLUMN IF NOT EXISTS pepm_price_cents   int NOT NULL DEFAULT 1500,
  ADD COLUMN IF NOT EXISTS billing_cycle      text NOT NULL DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS billing_start_date date;

-- ─── family_members: link employees to their employer ─────────────────────────
ALTER TABLE family_members
  ADD COLUMN IF NOT EXISTS employer_account_id uuid REFERENCES employer_accounts(id);

-- ─── employer_invitations ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS employer_invitations (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at            timestamptz DEFAULT now() NOT NULL,
  employer_account_id   uuid NOT NULL REFERENCES employer_accounts(id) ON DELETE CASCADE,
  invited_by_auth_id    uuid NOT NULL,
  email                 text NOT NULL,
  token                 text NOT NULL UNIQUE,
  status                text NOT NULL DEFAULT 'pending',
  expires_at            timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at           timestamptz,
  accepted_by_auth_id   uuid
);
ALTER TABLE employer_invitations ENABLE ROW LEVEL SECURITY;

-- employer_admin can manage invitations for their own account
CREATE POLICY IF NOT EXISTS "employer_admin_own_invitations" ON employer_invitations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.supabase_auth_id = auth.uid()
        AND fm.role = 'employer_admin'
        AND fm.employer_account_id = employer_invitations.employer_account_id
    )
  );

-- service role can always read/write (token validation happens server-side)
CREATE POLICY IF NOT EXISTS "service_role_all_invitations" ON employer_invitations FOR ALL
  USING (true);

-- ─── RLS: employer_admin can read their own employer_account row ──────────────
CREATE POLICY IF NOT EXISTS "employer_admin_own_account" ON employer_accounts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.supabase_auth_id = auth.uid()
        AND fm.role = 'employer_admin'
        AND fm.employer_account_id = employer_accounts.id
    )
  );

-- ─── Seed test employer account and employer_admin user ───────────────────────
-- Idempotent: will no-op if data already present.

DO $$
DECLARE
  v_employer_id uuid;
BEGIN
  -- Create a test employer account
  IF NOT EXISTS (SELECT 1 FROM employer_accounts WHERE contact_email = 'hr@acmecorp.test') THEN
    INSERT INTO employer_accounts (
      company_name, contact_name, contact_email,
      plan_tier, seats_purchased, seats_used, status,
      pepm_price_cents, billing_cycle, billing_start_date
    ) VALUES (
      'Acme Corp', 'Jane Smith', 'hr@acmecorp.test',
      'professional', 50, 3, 'active',
      1500, 'monthly', '2026-01-01'
    );
  END IF;

  SELECT id INTO v_employer_id FROM employer_accounts WHERE contact_email = 'hr@acmecorp.test';

  -- Create employer_admin family_members row (no auth user — navigator can create via Supabase dashboard)
  IF NOT EXISTS (
    SELECT 1 FROM family_members WHERE email = 'employer-admin@acmecorp.test'
  ) THEN
    INSERT INTO family_members (
      full_name, email, role, employer_account_id
    ) VALUES (
      'Jane Smith (Employer Admin)', 'employer-admin@acmecorp.test', 'employer_admin', v_employer_id
    );
  END IF;
END $$;
