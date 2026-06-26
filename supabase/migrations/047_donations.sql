-- Migration 047: Donations tracking for community orgs
CREATE TABLE IF NOT EXISTS org_donations (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at      timestamptz DEFAULT now() NOT NULL,
  org_id          uuid NOT NULL REFERENCES community_orgs(id) ON DELETE CASCADE,
  donor_name      text NOT NULL,
  donor_email     text,
  amount_cents    int NOT NULL DEFAULT 0,
  donation_date   date NOT NULL DEFAULT CURRENT_DATE,
  payment_method  text NOT NULL DEFAULT 'cash',
  -- cash, check, card, online, in_kind
  notes           text,
  is_anonymous    boolean NOT NULL DEFAULT false
);
ALTER TABLE org_donations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_admin_own_donations" ON org_donations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.supabase_auth_id = auth.uid()
      AND fm.org_id = org_donations.org_id
    )
  );
CREATE POLICY "admin_all_donations" ON org_donations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.supabase_auth_id = auth.uid()
      AND fm.role = 'admin'
    )
  );
CREATE INDEX IF NOT EXISTS idx_org_donations_org ON org_donations(org_id);
CREATE INDEX IF NOT EXISTS idx_org_donations_date ON org_donations(donation_date DESC);
