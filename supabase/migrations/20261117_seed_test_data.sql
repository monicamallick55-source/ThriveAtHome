-- Fix navigator_tasks: set completed=false where null so ?status=open returns rows
UPDATE navigator_tasks SET completed = false WHERE completed IS NULL OR completed = true;

-- Seed encore_career_opportunities if table exists (may not)
CREATE TABLE IF NOT EXISTS encore_career_opportunities (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title text,
  employer text,
  type text,
  description text,
  skills_needed text[],
  location text,
  remote_ok boolean DEFAULT false,
  hours_per_week integer,
  salary_range text,
  application_deadline date,
  status text DEFAULT 'open',
  created_at timestamptz DEFAULT now()
);
INSERT INTO encore_career_opportunities (id, title, employer, type, description, location, remote_ok, hours_per_week, salary_range, status)
VALUES
  ('eco-seed-001', 'Part-Time Community Outreach Coordinator', 'CommunityFirst', 'part_time', 'Coordinate outreach programs for seniors.', 'San Francisco, CA', true, 20, '$20-25/hr', 'open'),
  ('eco-seed-002', 'Senior Technology Mentor', 'TechBridge', 'volunteer', 'Help seniors learn technology safely.', 'Remote', true, 10, 'Volunteer', 'open')
ON CONFLICT (id) DO NOTHING;

-- Seed university_affiliates if table exists
CREATE TABLE IF NOT EXISTS university_affiliates (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);
INSERT INTO university_affiliates (id, name, status)
VALUES
  ('ua-seed-001', 'Stanford University', 'pending'),
  ('ua-seed-002', 'UC Berkeley', 'pending')
ON CONFLICT (id) DO NOTHING;

-- Seed billing_invoices
CREATE TABLE IF NOT EXISTS billing_invoices (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  stripe_invoice_id text,
  amount integer,
  status text DEFAULT 'paid',
  pdf_url text,
  created_at timestamptz DEFAULT now()
);
INSERT INTO billing_invoices (id, stripe_invoice_id, amount, status, pdf_url)
VALUES
  ('inv-seed-001', 'in_seed_001_thrive', 9900, 'paid', 'https://example.com/invoice-seed-001.pdf'),
  ('inv-seed-002', 'in_seed_002_thrive', 9900, 'paid', 'https://example.com/invoice-seed-002.pdf')
ON CONFLICT (id) DO NOTHING;

-- Seed vso_volunteer_hours
CREATE TABLE IF NOT EXISTS vso_volunteer_hours (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  volunteer_id text,
  hours numeric,
  status text DEFAULT 'pending_approval',
  description text,
  created_at timestamptz DEFAULT now()
);
INSERT INTO vso_volunteer_hours (id, hours, status, description)
VALUES
  ('vso-hr-seed-001', 2.5, 'pending_approval', 'Community outreach'),
  ('vso-hr-seed-002', 3.0, 'pending_approval', 'Senior tech help session')
ON CONFLICT (id) DO NOTHING;

-- Seed org_config_steps
CREATE TABLE IF NOT EXISTS org_config_steps (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title text,
  step_order integer,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);
INSERT INTO org_config_steps (id, title, step_order, status)
VALUES
  ('step-seed-001', 'Set up member portal', 1, 'pending'),
  ('step-seed-002', 'Configure care team', 2, 'pending'),
  ('step-seed-003', 'Launch communications', 3, 'pending')
ON CONFLICT (id) DO NOTHING;
