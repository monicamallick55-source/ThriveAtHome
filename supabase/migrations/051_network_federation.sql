-- Phase 66: Network Federation
-- Parent network accounts (VtVN, n4a) with aggregate reporting and dues billing

-- Add network_admin to user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'network_admin';

CREATE TABLE IF NOT EXISTS network_accounts (
  id                         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at                 timestamptz DEFAULT now() NOT NULL,
  name                       text NOT NULL,
  network_type               text NOT NULL DEFAULT 'other',
  -- 'vtvn' (Village to Village Network), 'n4a' (Nat'l Assoc. of Area Agencies on Aging),
  -- 'aarp', 'other'
  contact_name               text NOT NULL,
  contact_email              text NOT NULL,
  website                    text,
  dues_per_org_per_year_cents int NOT NULL DEFAULT 100000,
  member_org_count           int NOT NULL DEFAULT 0,
  total_members_served       int NOT NULL DEFAULT 0,
  status                     text NOT NULL DEFAULT 'active'
);
ALTER TABLE network_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_networks" ON network_accounts FOR ALL
  USING (EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.supabase_auth_id = auth.uid()
    AND fm.role IN ('admin', 'network_admin')
  ));

CREATE POLICY "network_admin_read_own" ON network_accounts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.supabase_auth_id = auth.uid()
    AND fm.role = 'network_admin'
    AND fm.network_id = network_accounts.id
  ));

-- Link community_orgs to a network
ALTER TABLE community_orgs ADD COLUMN IF NOT EXISTS network_id uuid REFERENCES network_accounts(id) ON DELETE SET NULL;

-- network_id on family_members for network admins
ALTER TABLE family_members ADD COLUMN IF NOT EXISTS network_id uuid REFERENCES network_accounts(id) ON DELETE SET NULL;

-- Annual dues invoices
CREATE TABLE IF NOT EXISTS network_dues (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at    timestamptz DEFAULT now() NOT NULL,
  network_id    uuid NOT NULL REFERENCES network_accounts(id) ON DELETE CASCADE,
  org_id        uuid NOT NULL REFERENCES community_orgs(id) ON DELETE CASCADE,
  fiscal_year   int NOT NULL,
  amount_cents  int NOT NULL,
  due_date      date NOT NULL,
  paid_date     date,
  status        text NOT NULL DEFAULT 'unpaid',
  -- 'unpaid', 'paid', 'waived', 'overdue'
  payment_notes text,
  UNIQUE(network_id, org_id, fiscal_year)
);
ALTER TABLE network_dues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_network_dues" ON network_dues FOR ALL
  USING (EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.supabase_auth_id = auth.uid()
    AND fm.role IN ('admin', 'network_admin')
  ));

-- Seed VtVN and n4a
INSERT INTO network_accounts (name, network_type, contact_name, contact_email, website, dues_per_org_per_year_cents) VALUES
  ('Village to Village Network', 'vtvn', 'VtVN Membership', 'membership@vtvnetwork.org', 'https://www.vtvnetwork.org', 75000),
  ('National Association of Area Agencies on Aging', 'n4a', 'n4a Membership', 'info@n4a.org', 'https://www.n4a.org', 100000)
ON CONFLICT DO NOTHING;
