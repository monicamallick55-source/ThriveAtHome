-- Migration 043: Community Organization Portal (M20, Phase 63)
-- Creates: community_orgs, org_programs, member_needs, org_memberships tables
-- Adds: org_admin to user_role enum, org_id to family_members

-- Add org_admin role to user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'org_admin';

-- Org type enum
CREATE TYPE org_type AS ENUM (
  'village_network',
  'senior_center',
  'nonprofit',
  'area_agency_on_aging',
  'faith_community',
  'other'
);

-- Member need status enum
CREATE TYPE member_need_status AS ENUM (
  'open',
  'claimed',
  'fulfilled',
  'cancelled'
);

-- Membership tier enum
CREATE TYPE org_membership_tier AS ENUM (
  'sliding_scale_low',
  'sliding_scale_mid',
  'standard',
  'supporting',
  'organizational'
);

-- Community organizations table
CREATE TABLE IF NOT EXISTS community_orgs (
  id                         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at                 timestamptz DEFAULT now() NOT NULL,
  updated_at                 timestamptz DEFAULT now() NOT NULL,
  org_name                   text NOT NULL,
  org_type                   org_type NOT NULL DEFAULT 'village_network',
  contact_name               text NOT NULL,
  contact_email              text NOT NULL,
  contact_phone              text,
  address                    text,
  city                       text,
  state                      text,
  zip_code                   text,
  website_url                text,
  description                text,
  service_area_description   text,
  member_count               int NOT NULL DEFAULT 0,
  is_active                  boolean NOT NULL DEFAULT true,
  annual_dues_standard_cents int NOT NULL DEFAULT 5000,
  annual_dues_sliding_low_cents  int NOT NULL DEFAULT 0,
  annual_dues_sliding_mid_cents  int NOT NULL DEFAULT 2500,
  dues_description           text
);
ALTER TABLE community_orgs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_admin_own_org" ON community_orgs FOR ALL
  USING (EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.supabase_auth_id = auth.uid()
    AND fm.org_id = community_orgs.id
  ));
CREATE POLICY "admin_all_orgs" ON community_orgs FOR ALL
  USING (EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.supabase_auth_id = auth.uid()
    AND fm.role = 'admin'
  ));
CREATE POLICY "authenticated_read_orgs" ON community_orgs FOR SELECT
  TO authenticated USING (true);

-- Updated_at trigger for community_orgs
CREATE OR REPLACE FUNCTION update_community_orgs_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER community_orgs_updated_at
  BEFORE UPDATE ON community_orgs
  FOR EACH ROW EXECUTE FUNCTION update_community_orgs_updated_at();

-- Programs table
CREATE TABLE IF NOT EXISTS org_programs (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at          timestamptz DEFAULT now() NOT NULL,
  org_id              uuid NOT NULL REFERENCES community_orgs(id) ON DELETE CASCADE,
  program_name        text NOT NULL,
  description         text,
  program_type        text NOT NULL DEFAULT 'general',
  is_active           boolean NOT NULL DEFAULT true,
  participants_count  int NOT NULL DEFAULT 0,
  volunteers_needed   int NOT NULL DEFAULT 0,
  volunteers_enrolled int NOT NULL DEFAULT 0,
  schedule_description text,
  contact_name        text,
  contact_phone       text
);
ALTER TABLE org_programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_admin_own_programs" ON org_programs FOR ALL
  USING (EXISTS (
    SELECT 1 FROM family_members fm
    JOIN community_orgs co ON co.id = org_programs.org_id
    WHERE fm.supabase_auth_id = auth.uid()
    AND fm.org_id = org_programs.org_id
  ));
CREATE POLICY "admin_all_programs" ON org_programs FOR ALL
  USING (EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.supabase_auth_id = auth.uid()
    AND fm.role = 'admin'
  ));
CREATE POLICY "authenticated_read_programs" ON org_programs FOR SELECT
  TO authenticated USING (true);

-- Member needs bulletin board
CREATE TABLE IF NOT EXISTS member_needs (
  id                        uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at                timestamptz DEFAULT now() NOT NULL,
  member_id                 uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  org_id                    uuid NOT NULL REFERENCES community_orgs(id) ON DELETE CASCADE,
  need_type                 text NOT NULL DEFAULT 'other',
  title                     text NOT NULL,
  description               text NOT NULL,
  urgency                   text NOT NULL DEFAULT 'normal',
  preferred_date            date,
  preferred_time            text,
  status                    member_need_status NOT NULL DEFAULT 'open',
  claimed_by_volunteer_id   uuid REFERENCES volunteers(id) ON DELETE SET NULL,
  claimed_at                timestamptz,
  fulfilled_at              timestamptz,
  fulfillment_notes         text
);
ALTER TABLE member_needs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_admin_needs_for_own_org" ON member_needs FOR ALL
  USING (EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.supabase_auth_id = auth.uid()
    AND fm.org_id = member_needs.org_id
  ));
CREATE POLICY "family_own_member_needs" ON member_needs FOR ALL
  USING (EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.supabase_auth_id = auth.uid()
    AND fm.member_id = member_needs.member_id
  ));
CREATE POLICY "admin_all_needs" ON member_needs FOR ALL
  USING (EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.supabase_auth_id = auth.uid()
    AND fm.role = 'admin'
  ));

-- Org memberships (annual dues tracking)
CREATE TABLE IF NOT EXISTS org_memberships (
  id                     uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at             timestamptz DEFAULT now() NOT NULL,
  member_id              uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  org_id                 uuid NOT NULL REFERENCES community_orgs(id) ON DELETE CASCADE,
  membership_tier        org_membership_tier NOT NULL DEFAULT 'standard',
  annual_dues_paid_cents int NOT NULL DEFAULT 0,
  dues_paid_date         date,
  membership_year        int NOT NULL DEFAULT EXTRACT(YEAR FROM now())::int,
  is_active              boolean NOT NULL DEFAULT true,
  notes                  text,
  UNIQUE(member_id, org_id, membership_year)
);
ALTER TABLE org_memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_admin_own_memberships" ON org_memberships FOR ALL
  USING (EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.supabase_auth_id = auth.uid()
    AND fm.org_id = org_memberships.org_id
  ));
CREATE POLICY "family_own_org_memberships" ON org_memberships FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.supabase_auth_id = auth.uid()
    AND fm.member_id = org_memberships.member_id
  ));
CREATE POLICY "admin_all_org_memberships" ON org_memberships FOR ALL
  USING (EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.supabase_auth_id = auth.uid()
    AND fm.role = 'admin'
  ));

-- Add org_id to family_members (links org_admin user to their org)
ALTER TABLE family_members ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES community_orgs(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_org_programs_org ON org_programs(org_id);
CREATE INDEX IF NOT EXISTS idx_member_needs_org_status ON member_needs(org_id, status);
CREATE INDEX IF NOT EXISTS idx_member_needs_member ON member_needs(member_id);
CREATE INDEX IF NOT EXISTS idx_org_memberships_org_year ON org_memberships(org_id, membership_year);

-- Seed: Bay Area Village Network
INSERT INTO community_orgs (
  org_name, org_type, contact_name, contact_email, contact_phone,
  city, state, zip_code,
  description, service_area_description,
  annual_dues_standard_cents, annual_dues_sliding_low_cents, annual_dues_sliding_mid_cents,
  dues_description
) VALUES (
  'Bay Area Village Network',
  'village_network',
  'Eleanor Rodriguez',
  'eleanor@bavnetwork.org',
  '(415) 555-0191',
  'San Francisco',
  'CA',
  '94110',
  'A member-supported community for older adults to live independently in San Francisco with the help of neighbors and volunteers.',
  'Mission, Bernal Heights, Castro, Noe Valley, and surrounding neighborhoods',
  5000,
  0,
  2500,
  'We use a sliding scale so cost is never a barrier. Pay what you can afford — from free to $50/year.'
)
ON CONFLICT DO NOTHING;

-- Seed 3 programs for Bay Area Village Network
INSERT INTO org_programs (org_id, program_name, description, program_type, participants_count, volunteers_needed, volunteers_enrolled, schedule_description)
SELECT
  co.id,
  program_name,
  description,
  program_type,
  participants_count,
  volunteers_needed,
  volunteers_enrolled,
  schedule_description
FROM community_orgs co
CROSS JOIN (VALUES
  ('Friendly Visitor Program', 'Weekly volunteer visits for homebound members — companionship, light errands, and a friendly face.', 'social', 12, 20, 8, 'Weekly, flexible scheduling'),
  ('Tech Help Tuesdays', 'Drop-in tech help every Tuesday — smartphones, video calls, online safety, and more.', 'technology', 18, 5, 3, 'Every Tuesday 10am–12pm'),
  ('Ride Share Network', 'Volunteer drivers give rides to medical appointments, grocery stores, and community events.', 'transport', 30, 15, 11, 'On-request, Mon–Fri')
) AS p(program_name, description, program_type, participants_count, volunteers_needed, volunteers_enrolled, schedule_description)
WHERE co.org_name = 'Bay Area Village Network'
ON CONFLICT DO NOTHING;
