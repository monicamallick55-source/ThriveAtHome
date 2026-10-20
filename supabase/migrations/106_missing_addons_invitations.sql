-- 106_missing_addons_invitations.sql
-- G5.7 remainder: 4 missing add-on SKUs + family_invitations table with seat limit

-- Add missing add-on SKUs
INSERT INTO addon_skus (name, slug, description, price_cents, billing_interval, category, sort_order, entitlement_key)
VALUES
  ('Family Onboarding Call', 'family-onboarding-call',
   'A one-time 45-min call with a navigator to get your family set up on the platform.', 2900, 'one_time', 'service', 8, null),
  ('Extra Navigator Hours', 'extra-navigator-hours',
   'Additional navigator support time beyond your plan''s included hours, billed per hour.', 2500, 'one_time', 'service', 9, 'extra_navigator_hours'),
  ('Companion Credit Bundle', 'companion-credit-bundle',
   '$120 in companion service credits for $100 — use toward any paid companion visits.', 10000, 'one_time', 'companion', 10, 'companion_credits'),
  ('Family Co-Signed Birthday Card', 'family-cosigned-birthday-card',
   'A printed birthday card signed by all family members, mailed to your loved one.', 999, 'one_time', 'service', 11, null)
ON CONFLICT (slug) DO NOTHING;

-- Family invitations table (replaces any ad-hoc invite tracking)
CREATE TABLE IF NOT EXISTS family_invitations (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at      timestamptz DEFAULT now() NOT NULL,
  member_id       uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  invited_by      uuid NOT NULL REFERENCES family_members(id),
  email           text NOT NULL,
  role            text NOT NULL DEFAULT 'family' CHECK (role IN ('family','caregiver')),
  token           text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at      timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at     timestamptz,
  revoked_at      timestamptz,
  UNIQUE (member_id, email)
);

ALTER TABLE family_invitations ENABLE ROW LEVEL SECURITY;

-- Member can see invitations for their own circle
DROP POLICY IF EXISTS "fi_own" ON family_invitations;
CREATE POLICY "fi_own" ON family_invitations FOR SELECT
  USING (member_id = ANY(acting_member_ids()) OR is_staff());

-- Only family members (acting on behalf of the member) or staff can create invitations
DROP POLICY IF EXISTS "fi_insert" ON family_invitations;
CREATE POLICY "fi_insert" ON family_invitations FOR INSERT
  WITH CHECK (member_id = ANY(acting_member_ids()) OR is_staff());

DROP POLICY IF EXISTS "fi_update" ON family_invitations;
CREATE POLICY "fi_update" ON family_invitations FOR UPDATE
  USING (member_id = ANY(acting_member_ids()) OR is_staff());
