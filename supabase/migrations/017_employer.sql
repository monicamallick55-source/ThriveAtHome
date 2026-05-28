-- Migration 017: Employer Portal MVP
-- Creates employer_accounts and employer_leads tables

CREATE TABLE employer_accounts (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at      timestamptz DEFAULT now() NOT NULL,
  company_name    text NOT NULL,
  contact_name    text NOT NULL,
  contact_email   text NOT NULL,
  plan_tier       text NOT NULL DEFAULT 'essentials',
  seats_purchased int NOT NULL DEFAULT 0,
  seats_used      int NOT NULL DEFAULT 0,
  status          text NOT NULL DEFAULT 'active'
);
ALTER TABLE employer_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_employer_accounts" ON employer_accounts FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM family_members fm WHERE fm.supabase_auth_id = auth.uid() AND fm.role = 'admin'));

CREATE TABLE employer_leads (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at    timestamptz DEFAULT now() NOT NULL,
  company_name  text NOT NULL,
  contact_name  text NOT NULL,
  email         text NOT NULL,
  phone         text,
  company_size  text,
  notes         text,
  status        text NOT NULL DEFAULT 'new',
  next_follow_up_date date
);
ALTER TABLE employer_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_employer_leads" ON employer_leads FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM family_members fm WHERE fm.supabase_auth_id = auth.uid() AND fm.role = 'admin'));
-- Service role can always insert (for unauthenticated demo request form)
CREATE POLICY "service_role_insert_leads" ON employer_leads FOR INSERT
  WITH CHECK (true);
