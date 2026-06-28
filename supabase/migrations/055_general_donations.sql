-- Migration 055: General donations table for platform-wide giving
-- Covers: direct family/member donations to ThriveAtHome, employer-matched donations, agency donations
-- Separate from org_donations (migration 047) which tracks org-specific community fundraising
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS donations (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at          timestamptz DEFAULT now() NOT NULL,
  org_id              uuid REFERENCES community_orgs(id) ON DELETE SET NULL,
  employer_account_id uuid REFERENCES employer_accounts(id) ON DELETE SET NULL,
  agency_id           uuid REFERENCES care_agencies(id) ON DELETE SET NULL,
  donor_name          text NOT NULL,
  donor_email         text,
  amount_cents        int NOT NULL,
  payment_method      text NOT NULL DEFAULT 'check',
  -- check, card, bank_transfer, paypal, in_kind, other
  donation_date       date NOT NULL DEFAULT CURRENT_DATE,
  is_recurring        boolean NOT NULL DEFAULT false,
  campaign            text,
  notes               text,
  receipt_sent        boolean NOT NULL DEFAULT false
);

ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

-- Admin can see all donations
CREATE POLICY "admin_all_donations" ON donations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.supabase_auth_id = auth.uid()
      AND fm.role = 'admin'
    )
  );

CREATE INDEX IF NOT EXISTS idx_donations_org ON donations(org_id);
CREATE INDEX IF NOT EXISTS idx_donations_employer ON donations(employer_account_id);
CREATE INDEX IF NOT EXISTS idx_donations_date ON donations(donation_date DESC);
